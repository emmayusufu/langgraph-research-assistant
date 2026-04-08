from dataclasses import dataclass, field


@dataclass
class User:
    id: str
    org_id: str
    email: str
    name: str = field(default="")
