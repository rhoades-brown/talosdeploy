output "kube_config" {
  value     = module.talos.kubeconfig.kubeconfig_raw
  sensitive = true
}

output "talos_config" {
  value     = module.talos.client_configuration.talos_config
  sensitive = true
}

output "host" {
  value = var.cluster.endpoint
}

output "client_certificate" {
  value = base64decode(module.talos.kubeconfig.kubernetes_client_configuration.client_certificate)
}

output "client_key" {
  value     = base64decode(module.talos.kubeconfig.kubernetes_client_configuration.client_key)
  sensitive = true
}

output "cluster_ca_certificate" {
  value = base64decode(module.talos.kubeconfig.kubernetes_client_configuration.ca_certificate)
}
