variable "host" {
  type = string
}

variable "client_certificate" {
  type = string
}

variable "client_key" {
  type = string
}

variable "cluster_ca_certificate" {
  type = string
}

variable "argocd" {
  type = object({
    sealed_password = string
    sealed_type     = string
    sealed_url      = string
    sealed_username = string
  })
}
