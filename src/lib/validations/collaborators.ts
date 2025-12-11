/**
 * Validation schemas for collaborator operations
 */

import { z } from 'zod'
import { cuid, emailSchema } from './shared'

/**
 * Collaborator role enum
 */
export const CollaboratorRole = z.enum(['editor', 'viewer'])
export type CollaboratorRoleType = z.infer<typeof CollaboratorRole>

/**
 * Schema for adding a collaborator
 */
export const addCollaboratorSchema = z.object({
  noteId: cuid('Invalid note ID'),
  email: emailSchema,
  role: CollaboratorRole,
})

export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>

/**
 * Schema for removing a collaborator
 */
export const removeCollaboratorSchema = z.object({
  noteId: cuid('Invalid note ID'),
  userId: cuid('Invalid user ID'),
})

export type RemoveCollaboratorInput = z.infer<typeof removeCollaboratorSchema>

/**
 * Schema for updating collaborator role
 */
export const updateCollaboratorRoleSchema = z.object({
  noteId: cuid('Invalid note ID'),
  userId: cuid('Invalid user ID'),
  role: CollaboratorRole,
})

export type UpdateCollaboratorRoleInput = z.infer<typeof updateCollaboratorRoleSchema>

/**
 * Schema for listing collaborators
 */
export const listCollaboratorsSchema = z.object({
  noteId: cuid('Invalid note ID'),
})

export type ListCollaboratorsInput = z.infer<typeof listCollaboratorsSchema>
