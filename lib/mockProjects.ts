// Simple in-memory store for mock project assignments
// In a real application, this would be in a database
const mockAssignments = new Map<string, string[]>()

export function getMockProjectsForMember(memberId: string): any[] {
  const assignedProjects = mockAssignments.get(memberId) || []
  
  if (assignedProjects.length === 0) {
    // Auto-assign a mock project for demo purposes
    mockAssignments.set(memberId, ['mock-project-1'])
    return [
      {
        id: 'mock-project-1',
        name: 'Johnson Corporate Office Redesign',
        status: 'in_progress',
        created_at: new Date().toISOString()
      }
    ]
  }
  
  return assignedProjects.map(projectId => ({
    id: projectId,
    name: 'Johnson Corporate Office Redesign',
    status: 'in_progress',
    created_at: new Date().toISOString()
  }))
}

export function clearMockProjectsForMember(memberId: string): boolean {
  const hadAssignments = mockAssignments.has(memberId)
  mockAssignments.delete(memberId)
  return hadAssignments
}