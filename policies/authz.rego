package authz

default allow = false

allow if input.role == "owner"
allow if {
	input.role == "editor"
	input.action in {"read", "write"}
}
allow if {
	input.role == "viewer"
	input.action == "read"
}
