import { snakeCase } from 'snake-case'

interface UniqueIdOptions {
  prefix: {
    name: string
  }
  suffix: string
}

export const uniqueId = ({ prefix, suffix }: UniqueIdOptions) =>
  `${snakeCase(prefix.name)}_${suffix}`
