output "ipaddress" {
  value       = local.ipaddress
  description = "the IP Address of the host"
}

//output "name" {
//  value       = proxmox_vm_qemu.this.name
//  description = "The name of the host"
//}//

//output "node" {
//  value = {
//    name      = proxmox_vm_qemu.this.name
//    ipaddress = local.ipaddress
//  }
//}
