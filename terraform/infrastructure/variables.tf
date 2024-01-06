variable "controllers" {
  type = object({
    name_prefix   = string
    a_quantity    = number
    b_quantity    = number
    cores         = number
    ram_gb        = number
    start_address = number
  })
  description = "controller node definition"
}

variable "workers" {
  type = object({
    name_prefix   = string
    a_quantity    = number
    b_quantity    = number
    cores         = number
    ram_gb        = number
    start_address = number
  })
  description = "worker node definitions"
}


variable "proxmox" {
  type = object({
    target_node    = string
    storage        = string
    subnet         = string
    gateway        = string
    dns            = list(string)
    search_domains = list(string)
  })
}

variable "cluster" {
  type = object({
    name         = string
    endpoint     = string
    endpoint_vip = string
  })
}
