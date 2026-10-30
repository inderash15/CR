from flask import Blueprint, request, jsonify
from app.models import Category, Product
from app.extensions import db
from app.middleware.auth import token_required

bp = Blueprint("categories", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_categories(current_user):
    categories = Category.query.all()
    data = []
    for c in categories:
        data.append({"id": c.id, "name": c.name, "status": c.status})
    return jsonify({"success": True, "data": data})


@bp.route("/", methods=["POST"])
@token_required
def create_category(current_user):
    if current_user.role != "ADMIN":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    try:
        new_category = Category(name=data["name"])
        db.session.add(new_category)
        db.session.commit()
        return (
            jsonify({"success": True, "message": "Category created successfully"}),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["PUT"])
@token_required
def update_category(current_user, id):
    if current_user.role != "ADMIN":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    try:
        category = db.session.get(Category, id)
        if not category:
            return jsonify({"success": False, "message": "Category not found"}), 404

        category.name = data.get("name", category.name)

        db.session.commit()
        return jsonify({"success": True, "message": "Category updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["DELETE"])
@token_required
def delete_category(current_user, id):
    if current_user.role != "ADMIN":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    try:
        category = db.session.get(Category, id)
        if not category:
            return jsonify({"success": False, "message": "Category not found"}), 404

        # If category has products, safely reassign them to 'Uncategorized'
        if category.products:
            uncat = Category.query.filter(Category.name == "Uncategorized", Category.id != category.id).first()
            if not uncat:
                uncat = Category(name="Uncategorized")
                db.session.add(uncat)
                db.session.flush()

            for prod in list(category.products):
                prod.category = uncat
                prod.category_id = uncat.id

        db.session.delete(category)
        db.session.commit()
        return jsonify({"success": True, "message": "Category deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
