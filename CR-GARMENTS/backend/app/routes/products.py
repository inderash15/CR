from flask import Blueprint, request, jsonify
from app.models import (
    Product,
    PurchaseItem,
    SaleItem,
    OrderItem,
    ReturnItem,
    StockMovement,
)
from app.extensions import db
from app.middleware.auth import token_required
from sqlalchemy.orm import joinedload

bp = Blueprint("products", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_products(current_user):
    products = Product.query.options(joinedload(Product.category)).all()
    data = []
    for p in products:
        data.append(
            {
                "id": p.id,
                "product_code": p.product_code,
                "name": p.name,
                "category_id": p.category_id,
                "category": p.category.name if p.category else "Uncategorized",
                "purchase_price": p.purchase_price,
                "selling_price": p.selling_price,
                "stock_quantity": p.stock_quantity,
                "min_stock": p.min_stock,
                "brand": p.brand or "",
                "fabric": p.fabric or "",
                "size": p.size or "",
                "color": p.color or "",
                "status": p.status,
                "description": p.description,
                "image_url": p.image,
            }
        )
    return jsonify({"success": True, "data": data})


@bp.route("/", methods=["POST"])
@token_required
def create_product(current_user):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    try:
        new_product = Product(
            product_code=data["product_code"],
            name=data["name"],
            category_id=data["category_id"],
            purchase_price=float(data.get("purchase_price", 0)),
            selling_price=float(data.get("selling_price", 0)),
            stock_quantity=int(data.get("stock_quantity", 0)),
            min_stock=int(data.get("min_stock", 10)),
            brand=data.get("brand", ""),
            fabric=data.get("fabric", ""),
            size=data.get("size", ""),
            color=data.get("color", ""),
            description=data.get("description", ""),
        )
        db.session.add(new_product)
        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Product created successfully",
                    "product_id": new_product.id,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["PUT"])
@token_required
def update_product(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or {}
    try:
        product = db.session.get(Product, id)
        if not product:
            return jsonify({"success": False, "message": "Product not found"}), 404

        product.product_code = data.get("product_code", product.product_code)
        product.name = data.get("name", product.name)
        product.category_id = data.get("category_id", product.category_id)
        if "purchase_price" in data:
            product.purchase_price = float(data["purchase_price"])
        if "selling_price" in data:
            product.selling_price = float(data["selling_price"])
        if "stock_quantity" in data:
            product.stock_quantity = int(data["stock_quantity"])
        if "min_stock" in data:
            product.min_stock = int(data["min_stock"])
        product.brand = data.get("brand", product.brand)
        product.fabric = data.get("fabric", product.fabric)
        product.size = data.get("size", product.size)
        product.color = data.get("color", product.color)
        product.description = data.get("description", product.description)

        db.session.commit()
        return jsonify({"success": True, "message": "Product updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["DELETE"])
@token_required
def delete_product(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    try:
        product = db.session.get(Product, id)
        if not product:
            return jsonify({"success": False, "message": "Product not found"}), 404

        # Clean up all related items and stock movements to allow clean deletion
        StockMovement.query.filter_by(product_id=id).delete()
        OrderItem.query.filter_by(product_id=id).delete()
        SaleItem.query.filter_by(product_id=id).delete()
        PurchaseItem.query.filter_by(product_id=id).delete()
        ReturnItem.query.filter_by(product_id=id).delete()

        db.session.delete(product)
        db.session.commit()
        return jsonify({"success": True, "message": "Product deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
