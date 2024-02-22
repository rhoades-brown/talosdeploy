variable "name" {
  type = string
}

variable "ram" {
  type        = number
  description = "GB of RAM"
}

variable "cores" {
  type        = number
  description = "cores"
}

variable "storage" {
  type = string
}

variable "target_node" {
  type = string
}

variable "hostnumber" {
  type = string
}

variable "gateway" {
  type = string
}

variable "subnet" {
  type = string
}

variable "start_address" {
  type = number
}

variable "nameserver" {
  type = string
}

variable "search_domain" {
  type = string
}

variable "description" {
  type = string
}
