from pydantic import BaseModel


class ImprovementProgressUpdate(BaseModel):
    completed_task_ids: list[str]