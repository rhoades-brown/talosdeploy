variable "cluster_name" {
  type        = string
  description = "The name of the cluster"
}

variable "cluster_endpoint" {
  type        = string
  description = "The cluster endpoint"
}

variable "endpoint_vip" {
  type        = string
  description = "The ip addess of the cluster endpoint"
}

variable "controllers" {
  type = list(object({
    name      = string
    ipaddress = string
  }))
}

variable "workers" {
  type = list(object({
    name      = string
    ipaddress = string
  }))
}

//variable "controllers" {
//  type = list(object({
//    name      = string
//    ipaddress = string
//  }))
//}
