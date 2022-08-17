#!/usr/bin/env bash

yum update -y
amazon-linux-extras enable nginx1
yum clean metadata
yum install -y nginx
systemctl start nginx
systemctl enable nginx
