from flask import Blueprint, request, jsonify
from app.models import Order, OrderItem, Product
from app.extensions import db
from app.middleware.auth import token_required
from datetime import datetime

bp = Blueprint("orders", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_orders(current_user):
    try:
        orders = Order.query.order_by(Order.order_date.desc()).all()
        data = []
        for o in orders:
            data.append(
                {
                    "id": o.id,
                    "customer_id": o.customer_id,
                    "customer_name": o.customer.name if o.customer else "Walk-in Guest",
                    "customer_phone": o.customer.phone if o.customer else "",
                    "total_amount": o.total_amount,
                    "payment_status": o.payment_status,
                    "status": o.status,
                    "order_date": o.order_date.isoformat() if o.order_date else None,
                    "items_count": len(o.items) if o.items else 0,
                    "items": (
                        [
                            {
                                "product_id": item.product_id,
                                "product_name": (
                                    item.product.name if item.product else "Product"
                                ),
                                "quantity": item.quantity,
                                "price": item.price,
                                "total": item.total,
                            }
                            for item in o.items
                        ]
                        if o.items
                        else []
                    ),
                }
            )
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/", methods=["POST"])
@token_required
def create_order(current_user):
    data = request.get_json() or {}
    customer_id = data.get("customer_id")
    items = data.get("items", [])

    if not items:
        return jsonify({"success": False, "message": "Items are required"}), 400

    try:
        total_amount = sum(
            float(item.get("price", 0)) * int(item.get("quantity", 1)) for item in items
        )

        new_order = Order(
            customer_id=customer_id,
            total_amount=total_amount,
            payment_status=data.get("payment_status", "PAID"),
            status=data.get("status", "Pending"),
            order_date=datetime.utcnow(),
        )
        db.session.add(new_order)
        db.session.flush()

        for item in items:
            product = db.session.get(Product, item["product_id"])
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item["product_id"],
                quantity=item.get("quantity", 1),
                price=item.get("price", product.selling_price if product else 0.0),
                total=float(item.get("price", 0)) * int(item.get("quantity", 1)),
            )
            db.session.add(order_item)

        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Order created successfully",
                    "order_id": new_order.id,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["PUT"])
@token_required
def update_order_status(current_user, id):
    try:
        order = db.session.get(Order, id)
        if not order:
            return jsonify({"success": False, "message": "Order not found"}), 404

        data = request.get_json() or {}
        new_status = data.get("status")
        if new_status:
            order.status = new_status
        if "payment_status" in data:
            order.payment_status = data["payment_status"]

        db.session.commit()
        return jsonify({"success": True, "message": "Order updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
