from flask import Blueprint, request, jsonify
from app.models import Sale, SaleItem, Product, StockMovement, Customer
from app.extensions import db
from app.middleware.auth import token_required

bp = Blueprint("sales", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_sales(current_user):
    try:
        sales = Sale.query.order_by(Sale.created_at.desc()).limit(100).all()
        data = []
        for s in sales:
            data.append(
                {
                    "id": s.id,
                    "invoice_no": f"INV-{s.id:04d}",
                    "customer_id": s.customer_id,
                    "customer_name": (
                        s.customer.name if s.customer else "Walk-in Customer"
                    ),
                    "subtotal": s.subtotal,
                    "discount": s.discount,
                    "tax": s.tax,
                    "grand_total": s.grand_total,
                    "payment_method": s.payment_method or "CASH",
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "items_count": len(s.items) if s.items else 0,
                    "items": (
                        [
                            {
                                "product_id": item.product_id,
                                "product_name": (
                                    item.product.name if item.product else "Item"
                                ),
                                "quantity": item.quantity,
                                "price": item.price,
                                "total": item.total,
                            }
                            for item in s.items
                        ]
                        if s.items
                        else []
                    ),
                }
            )
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/", methods=["POST"])
@token_required
def create_sale(current_user):
    data = request.get_json() or {}
    cart = data.get("cart", [])
    discount = float(data.get("discount", 0))
    tax = float(data.get("tax", 0))
    grand_total = float(data.get("grandTotal", 0))
    customer_id = data.get("customer_id")
    payment_method = data.get("payment_method", "CASH")

    if not cart:
        return jsonify({"success": False, "message": "Cart is empty"}), 400

    try:
        subtotal = sum(
            [float(item["selling_price"]) * int(item["quantity"]) for item in cart]
        )
        if grand_total <= 0:
            grand_total = subtotal - discount + tax

        new_sale = Sale(
            customer_id=customer_id,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            grand_total=grand_total,
            payment_method=payment_method,
        )
        db.session.add(new_sale)
        db.session.flush()

        for item in cart:
            product = db.session.get(Product, item["id"])
            if not product:
                raise Exception(f"Product ID {item.get('id')} not found.")

            current_stock = product.stock_quantity or 0
            if current_stock < item["quantity"]:
                raise Exception(f"Insufficient stock for {product.name}")

            sale_item = SaleItem(
                sale_id=new_sale.id,
                product_id=product.id,
                quantity=item["quantity"],
                price=product.selling_price,
                total=product.selling_price * item["quantity"],
            )
            db.session.add(sale_item)

            movement = StockMovement(
                product_id=product.id,
                quantity=item["quantity"],
                movement_type="SALE",
                previous_stock=current_stock,
                new_stock=current_stock - item["quantity"],
                reference=f"SALE-{new_sale.id}",
                user_id=current_user.id if current_user else None,
            )
            db.session.add(movement)

            product.stock_quantity = current_stock - item["quantity"]

        # Update customer purchases if customer linked
        if customer_id:
            customer = db.session.get(Customer, customer_id)
            if customer:
                customer.total_purchases = (
                    customer.total_purchases or 0.0
                ) + grand_total
                customer.loyalty_points = (
                    getattr(customer, "loyalty_points", 0) or 0
                ) + int(grand_total // 100)

        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Sale completed successfully",
                    "sale_id": new_sale.id,
                    "invoice_no": f"INV-{new_sale.id:04d}",
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
