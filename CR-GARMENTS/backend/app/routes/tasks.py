from flask import Blueprint, request, jsonify
from app.models import Task, User, TaskComment
from app.extensions import db
from app.middleware.auth import token_required
from datetime import datetime

bp = Blueprint("tasks", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_tasks(current_user):
    try:
        if current_user.role == "ADMIN":
            tasks = Task.query.order_by(Task.due_date.asc()).all()
        elif current_user.role == "MANAGER":
            tasks = (
                Task.query.join(User, Task.assigned_to == User.id)
                .filter(User.role != "ADMIN")
                .order_by(Task.due_date.asc())
                .all()
            )
        else:
            tasks = (
                Task.query.filter_by(assigned_to=current_user.id)
                .order_by(Task.due_date.asc())
                .all()
            )

        data = []
        for t in tasks:
            data.append(
                {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "assigned_to_id": t.assigned_to,
                    "assigned_to": t.assignee.name if t.assignee else "Unassigned",
                    "assigned_by": t.assigner.name if t.assigner else "Manager",
                    "priority": t.priority,
                    "status": t.status,
                    "progress": t.progress,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "created_at": t.created_at.isoformat() if t.created_at else None,
                }
            )

        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/", methods=["POST"])
@token_required
def create_task(current_user):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Only Admins and Managers can assign tasks",
                }
            ),
            403,
        )

    data = request.get_json() or {}
    try:
        due_date = None
        if data.get("due_date"):
            due_date_str = data["due_date"].replace("Z", "+00:00")
            try:
                due_date = datetime.fromisoformat(due_date_str)
            except Exception:
                due_date = datetime.utcnow()

        new_task = Task(
            title=data["title"],
            description=data.get("description", ""),
            assigned_to=int(data["assigned_to"]),
            assigned_by=current_user.id,
            priority=data.get("priority", "Medium"),
            due_date=due_date,
        )
        db.session.add(new_task)
        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Task created successfully",
                    "task_id": new_task.id,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>/progress", methods=["PUT"])
@token_required
def update_progress(current_user, id):
    try:
        task = db.session.get(Task, id)
        if not task:
            return jsonify({"success": False, "message": "Task not found"}), 404

        if current_user.role == "EMPLOYEE" and task.assigned_to != current_user.id:
            return jsonify({"success": False, "message": "Unauthorized"}), 403

        data = request.get_json() or {}

        if "status" in data:
            task.status = data["status"]
            if data["status"] == "Completed":
                task.progress = 100

        if "progress" in data:
            task.progress = int(data["progress"])
            if task.progress >= 100 and task.status != "Completed":
                task.status = "Completed"

        db.session.commit()
        return jsonify({"success": True, "message": "Task updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/<int:id>", methods=["DELETE"])
@token_required
def delete_task(current_user, id):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    try:
        task = db.session.get(Task, id)
        if not task:
            return jsonify({"success": False, "message": "Task not found"}), 404

        TaskComment.query.filter_by(task_id=id).delete()
        db.session.delete(task)
        db.session.commit()
        return jsonify({"success": True, "message": "Task deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400
