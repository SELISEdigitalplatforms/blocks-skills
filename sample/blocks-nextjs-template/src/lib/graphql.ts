import { getAuthState } from './https'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.seliseblocks.com'
const X_BLOCKS_KEY = process.env.NEXT_PUBLIC_X_BLOCKS_KEY ?? ''

export interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
  }>
}

export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
}

const doFetch = async (
  query: string,
  variables: Record<string, unknown> | undefined,
  accessToken: string | null
): Promise<GraphQLResponse<unknown>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-blocks-key': X_BLOCKS_KEY,
    accept: 'application/json',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const res = await fetch(
    `${API_BASE_URL}/uds/v1/${X_BLOCKS_KEY}/gateway`,
    {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    }
  )

  return res.json() as Promise<GraphQLResponse<unknown>>
}

export const graphqlQuery = async <T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  const { accessToken, refreshToken } = getAuthState()

  let res = await doFetch(query, variables, accessToken)

  // Token expired — attempt refresh
  if (refreshToken) {
    try {
      const refreshRes = await fetch(
        `${API_BASE_URL}/idp/v1/Authentication/Token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-blocks-key': X_BLOCKS_KEY,
            accept: 'application/json',
          },
          credentials: 'include',
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
        }
      )

      if (refreshRes.ok) {
        const data = await refreshRes.json() as {
          access_token: string
          refresh_token?: string
        }

        // Update global auth state
        const { setAuthState: setAuth } = await import('./https')
        setAuth({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? refreshToken,
        })

        // Retry with new token
        res = await doFetch(query, variables, data.access_token)
      }
    } catch {
      // Refresh failed — proceed with stale response
    }
  }

  const result = res as GraphQLResponse<T>

  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message).join(', '))
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL query')
  }

  return result.data as T
}

export const graphqlMutation = async <T>(
  mutation: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  return graphqlQuery<T>(mutation, variables)
}

export const getCollectionName = (schemaName: string): string =>
  schemaName.charAt(0).toLowerCase() + schemaName.slice(1) + 's'

export const getQueryName = (schemaName: string, single = false): string =>
  `get${schemaName}${single ? '' : 's'}`

export const getMutationNames = (schemaName: string) => ({
  create: `create${schemaName}`,
  update: `update${schemaName}`,
  delete: `delete${schemaName}`,
})
