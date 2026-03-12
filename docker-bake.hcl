variable "REGISTRY" {
  default = "registry.depot.dev"
}

variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["api", "web"]
}

target "api" {
  dockerfile = "packages/api/Dockerfile"
  context    = "."
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["${REGISTRY}/depot-ci-checker-api:${TAG}"]
}

target "web" {
  dockerfile = "packages/web/Dockerfile"
  context    = "."
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["${REGISTRY}/depot-ci-checker-web:${TAG}"]
}
