from flask import Blueprint, request, jsonify
from app.models import Customer, Order, OrderItem, Sale
from app.extensions import db
from app.middleware.auth import token_required

bp = Blueprint("customers", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_customers(current_user):
    customers = Customer.query.all()
    data = []
    for c in customers:
        data.append(
            {
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "email": c.email,
                "address": c.address,
                "city": c.city,
                "loyalty_points": getattr(c, "loyalty_points", 0) or 0,
                "total_purchases": c.total_purchases or 0.0,
            }
        )
    return jsonify({"success": True, "data": data})


@bp.route("/", methods=["POST"])
@token_required
def create_customer(current_user):
    data = request.get_json() or {}
    try:
        raw_phone = str(data.get("phone", "")).strip()
        phone_digits = "".join(filter(str.isdigit, raw_phone))

        if len(phone_digits) < 10:
            return (
                jsonify({
                    "success": False,
                    "message": f"Phone number must be exactly 10 digits. You entered {len(phone_digits)} digit(s) (less than 10)."
                }),
                400,
            )

        if len(phone_digits) > 10:
            return (
                jsonify({
                    "success": False,
                    "message": f"Phone number must be exactly 10 digits. You entered {len(phone_digits)} digit(s) (greater than 10)."
                }),
                400,
            )

        new_customer = Customer(
            name=data["name"],
            phone=phone_digits,
            email=data.get("email", ""),
            address=data.get("address", ""),
            city=data.get("city", ""),
            loyalty_points=data.get("loyalty_points", 0),
        )
        db.session.add(new_customer)
        db.session.commit()
        return (
            jsonify({"success": True, "message": "Customer created successfully"}),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["PUT"])
@token_required
def update_customer(current_user, id):
    data = request.get_json() or {}
    try:
        customer = db.session.get(Customer, id)
        if not customer:
            return jsonify({"success": False, "message": "Customer not found"}), 404

        if "phone" in data:
            raw_phone = str(data["phone"]).strip()
            phone_digits = "".join(filter(str.isdigit, raw_phone))

            if len(phone_digits) < 10:
                return (
                    jsonify({
                        "success": False,
                        "message": f"Phone number must be exactly 10 digits. You entered {len(phone_digits)} digit(s) (less than 10)."
                    }),
                    400,
                )

            if len(phone_digits) > 10:
                return (
                    jsonify({
                        "success": False,
                        "message": f"Phone number must be exactly 10 digits. You entered {len(phone_digits)} digit(s) (greater than 10)."
                    }),
                    400,
                )

            customer.phone = phone_digits

        customer.name = data.get("name", customer.name)
        customer.email = data.get("email", customer.email)
        customer.address = data.get("address", customer.address)
        customer.city = data.get("city", customer.city)
        if "loyalty_points" in data:
            customer.loyalty_points = data["loyalty_points"]

        db.session.commit()
        return jsonify({"success": True, "message": "Customer updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["DELETE"])
@token_required
def delete_customer(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    try:
        customer = db.session.get(Customer, id)
        if not customer:
            return jsonify({"success": False, "message": "Customer not found"}), 404

        # Clean up related orders and order items
        orders = Order.query.filter_by(customer_id=id).all()
        for o in orders:
            OrderItem.query.filter_by(order_id=o.id).delete()
            db.session.delete(o)

        # Unlink sales record from customer
        Sale.query.filter_by(customer_id=id).update({"customer_id": None})

        db.session.delete(customer)
        db.session.commit()
        return jsonify({"success": True, "message": "Customer deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
