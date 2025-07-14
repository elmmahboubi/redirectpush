import { supabase } from './supabase'

export interface User {
  id: string
  username: string
  role: string
  created_at: string
  last_login?: string
}

// Simple hash function for demo purposes
// In production, use proper bcrypt or similar
const simpleHash = (password: string): string => {
  return btoa(password) // Base64 encoding for demo
}

// Verify password against hash
const verifyPassword = (password: string, hash: string): boolean => {
  return simpleHash(password) === hash
}

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    console.log('🔐 Authenticating user:', username)
    
    // Query the users table for the username
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)

    if (error) {
      console.error('❌ Database error during authentication:', error)
      return null
    }

    if (!users || users.length === 0) {
      console.log('❌ User not found:', username)
      return null
    }

    const user = users[0]
    console.log('✅ User found:', { id: user.id, username: user.username, role: user.role })

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      console.log('❌ Invalid password for user:', username)
      return null
    }

    console.log('✅ Password verified for user:', username)

    // Update last login time
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword as User

  } catch (error) {
    console.error('❌ Authentication error:', error)
    return null
  }
}

export const createUser = async (username: string, password: string, role: string = 'user'): Promise<User | null> => {
  try {
    console.log('👤 Creating new user:', username)
    
    const passwordHash = simpleHash(password)
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        role
      })
      .select('id, username, role, created_at')
      .single()

    if (error) {
      console.error('❌ Error creating user:', error)
      return null
    }

    console.log('✅ User created successfully:', user)
    return user as User

  } catch (error) {
    console.error('❌ Error creating user:', error)
    return null
  }
}

export const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
  try {
    const passwordHash = simpleHash(newPassword)
    
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating password:', error)
      return false
    }

    console.log('✅ Password updated successfully')
    return true

  } catch (error) {
    console.error('❌ Error updating password:', error)
    return false
  }
} 