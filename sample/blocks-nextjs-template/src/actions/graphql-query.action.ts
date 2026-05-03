'use server'

import { graphqlQuery } from '@/lib/services/data-management.service'

export async function queryProductsAction(page = 1, pageSize = 20) {
  const result = await graphqlQuery<{
    getProducts: { items: Product[]; totalCount: number }
  }>(`
    query GetProducts($page: Int, $pageSize: Int) {
      getProducts(page: $page, pageSize: $pageSize) {
        items { _id name price createdAt }
        totalCount
      }
    }
  `, { page, pageSize })

  return result
}

export async function createProductAction(input: { name: string; price: number; description?: string }) {
  const result = await graphqlQuery<{ createProduct: { _id: string; name: string } }>(`
    mutation CreateProduct($input: ProductInput!) {
      createProduct(input: $input) { _id name }
    }
  `, { input })

  return result
}

interface Product {
  _id: string
  name: string
  price: number
  createdAt: string
}
