export const awsRegion = 'ap-northeast-1'
export const defaultTag = 'nw-q3'
export const domain = 'second.knakayama.io'

export const CidrBlocks = {
  vpc: '192.168.0.0/16',
  publicSubnets: ['192.168.1.0/24', '192.168.2.0/24'],
  privateSubnets: ['192.168.100.0/24', '192.168.101.0/24'],
  isolatedSubnets: ['192.168.200.0/24', '192.168.201.0/24'],
} as const
