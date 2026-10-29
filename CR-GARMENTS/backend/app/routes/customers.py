from flask import Blueprint, request, jsonify
from app.models import Customer
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
        new_customer = Customer(
            name=data["name"],
            phone=data.get("phone", ""),
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

        customer.name = data.get("name", customer.name)
        customer.phone = data.get("phone", customer.phone)
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

        db.session.delete(customer)
        db.session.commit()
        return jsonify({"success": True, "message": "Customer deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
