output "kubeconfig" {
  value = data.talos_cluster_kubeconfig.this
}

output "client_configuration" {
  value = data.talos_client_configuration.this[0]
}
