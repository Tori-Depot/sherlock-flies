variable "REGISTRY" {
  default = "registry.depot.dev"
}

variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["web"]
}

target "web" {
  dockerfile = "packages/web/Dockerfile"
  context    = "."
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["${REGISTRY}/sherlock-flies:${TAG}"]
}
