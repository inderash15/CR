from flask import Blueprint, request, jsonify
from app.models import Supplier
from app.extensions import db
from app.middleware.auth import token_required

bp = Blueprint("suppliers", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_suppliers(current_user):
    suppliers = Supplier.query.all()
    data = []
    for s in suppliers:
        data.append(
            {
                "id": s.id,
                "name": s.name,
                "company": s.company,
                "phone": s.phone,
                "email": s.email,
                "address": s.address,
                "gst_number": s.gst_number,
                "status": s.status,
            }
        )
    return jsonify({"success": True, "data": data})


@bp.route("/", methods=["POST"])
@token_required
def create_supplier(current_user):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    try:
        new_supplier = Supplier(
            name=data["name"],
            company=data.get("company", ""),
            phone=data.get("phone", ""),
            email=data.get("email", ""),
            address=data.get("address", ""),
            gst_number=data.get("gst_number", ""),
        )
        db.session.add(new_supplier)
        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Supplier created successfully",
                    "supplier_id": new_supplier.id,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["PUT"])
@token_required
def update_supplier(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    try:
        supplier = db.session.get(Supplier, id)
        if not supplier:
            return jsonify({"success": False, "message": "Supplier not found"}), 404

        supplier.name = data.get("name", supplier.name)
        supplier.company = data.get("company", supplier.company)
        supplier.phone = data.get("phone", supplier.phone)
        supplier.email = data.get("email", supplier.email)
        supplier.address = data.get("address", supplier.address)
        supplier.gst_number = data.get("gst_number", supplier.gst_number)

        db.session.commit()
        return jsonify({"success": True, "message": "Supplier updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["DELETE"])
@token_required
def delete_supplier(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    try:
        supplier = db.session.get(Supplier, id)
        if not supplier:
            return jsonify({"success": False, "message": "Supplier not found"}), 404

        db.session.delete(supplier)
        db.session.commit()
        return jsonify({"success": True, "message": "Supplier deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
