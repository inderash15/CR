from flask import Blueprint, request, jsonify
from app.models import Purchase, PurchaseItem, Product, StockMovement, Supplier
from app.extensions import db
from app.middleware.auth import token_required

bp = Blueprint("purchases", __name__)


@bp.route("/", methods=["POST"])
@token_required
def create_purchase(current_user):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    supplier_id = data.get("supplier_id")
    items = data.get("items", [])

    if not supplier_id or not items:
        return (
            jsonify({"success": False, "message": "Supplier and items are required"}),
            400,
        )

    try:
        supplier = db.session.get(Supplier, supplier_id)
        if not supplier:
            return jsonify({"success": False, "message": "Supplier not found"}), 404

        total_amount = sum(
            float(item.get("purchase_price", 0)) * int(item.get("quantity", 0))
            for item in items
        )

        new_purchase = Purchase(
            supplier_id=supplier.id,
            total_amount=total_amount,
            payment_status=data.get("payment_status", "PAID"),
        )
        db.session.add(new_purchase)
        db.session.flush()

        for item in items:
            product_id = item.get("product_id")
            if not product_id:
                raise Exception("Product ID is missing in one of the items.")

            product = db.session.get(Product, product_id)
            if not product:
                raise Exception(f"Product ID {product_id} not found.")

            qty = int(item.get("quantity", 0))
            price = float(item.get("purchase_price", 0))

            if qty <= 0:
                raise Exception(f"Invalid quantity for product {product.name}")

            purchase_item = PurchaseItem(
                purchase_id=new_purchase.id,
                product_id=product.id,
                quantity=qty,
                purchase_price=price,
                total=price * qty,
            )
            db.session.add(purchase_item)

            current_stock = product.stock_quantity or 0
            movement = StockMovement(
                product_id=product.id,
                quantity=qty,
                movement_type="PURCHASE",
                previous_stock=current_stock,
                new_stock=current_stock + qty,
                reference=f"PURCHASE-{new_purchase.id}",
                user_id=current_user.id if current_user else None,
            )
            db.session.add(movement)
            product.stock_quantity = current_stock + qty

        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Purchase completed successfully",
                    "purchase_id": new_purchase.id,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/", methods=["GET"])
@token_required
def get_purchases(current_user):
    purchases = Purchase.query.order_by(Purchase.created_at.desc()).all()
    data = []
    for p in purchases:
        supplier = db.session.get(Supplier, p.supplier_id)
        data.append(
            {
                "id": p.id,
                "supplier_id": p.supplier_id,
                "supplier_name": supplier.name if supplier else "Unknown",
                "total_amount": p.total_amount,
                "payment_status": p.payment_status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "items_count": len(p.items) if p.items else 0,
            }
        )
    return jsonify({"success": True, "data": data})


@bp.route("/<int:id>", methods=["DELETE"])
@token_required
def delete_purchase(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    try:
        purchase = db.session.get(Purchase, id)
        if not purchase:
            return jsonify({"success": False, "message": "Purchase not found"}), 404

        items = PurchaseItem.query.filter_by(purchase_id=id).all()
        for item in items:
            product = db.session.get(Product, item.product_id)
            if product:
                current_stock = product.stock_quantity or 0
                new_stock = max(0, current_stock - item.quantity)
                product.stock_quantity = new_stock

                movement = StockMovement(
                    product_id=product.id,
                    quantity=-item.quantity,
                    movement_type="RETURN",
                    previous_stock=current_stock,
                    new_stock=new_stock,
                    reference=f"PURCHASE-REVERSED-{id}",
                    user_id=current_user.id,
                )
                db.session.add(movement)
            db.session.delete(item)

        db.session.delete(purchase)
        db.session.commit()
        return jsonify(
            {
                "success": True,
                "message": "Purchase deleted and stock reversed successfully",
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
