const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createRealProjectAssignments() {
  console.log('🎯 Creating real project assignments...')

  try {
    // 1. Get existing projects and team members
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .limit(3)

    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('id, name, user_id')
      .limit(3)

    if (projectsError || membersError) {
      console.error('Error fetching data:', { projectsError, membersError })
      return
    }

    console.log(`Found ${projects?.length || 0} projects and ${teamMembers?.length || 0} team members`)

    // 2. Check project_tasks table structure
    const { data: existingTasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .limit(1)

    console.log('project_tasks table check:', { error: tasksError?.message, hasData: !!existingTasks })

    // 3. Create project assignments by inserting tasks
    if (projects && teamMembers && projects.length > 0 && teamMembers.length > 0) {
      const assignmentsToCreate = []

      // Assign each team member to the first project
      teamMembers.forEach((member, index) => {
        const project = projects[0] // Assign all to first project for simplicity
        
        assignmentsToCreate.push({
          project_id: project.id,
          task_title: `Design Review for ${project.name}`,
          task_description: `Complete design review and provide feedback for ${project.name}`,
          assigned_to: member.id,
          status: 'in_progress',
          priority: 'high',
          due_date: '2025-10-01'
        })
      })

      console.log(`Creating ${assignmentsToCreate.length} task assignments...`)

      // Try different column names for task insertion
      const variations = [
        // Try with task_title and task_description
        assignmentsToCreate,
        // Try with title and description
        assignmentsToCreate.map(task => ({
          project_id: task.project_id,
          title: task.task_title,
          description: task.task_description,
          assigned_to: task.assigned_to,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date
        })),
        // Try with name and description
        assignmentsToCreate.map(task => ({
          project_id: task.project_id,
          name: task.task_title,
          description: task.task_description,
          assigned_to: task.assigned_to,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date
        }))
      ]

      let insertSuccess = false
      
      for (let i = 0; i < variations.length; i++) {
        console.log(`Trying variation ${i + 1} for task insertion...`)
        
        const { data: insertedTasks, error: insertError } = await supabase
          .from('project_tasks')
          .insert(variations[i])
          .select()

        if (!insertError) {
          console.log(`✅ Successfully created ${insertedTasks?.length || 0} task assignments (variation ${i + 1})`)
          insertSuccess = true
          break
        } else {
          console.log(`❌ Variation ${i + 1} failed:`, insertError.message)
        }
      }

      if (!insertSuccess) {
        console.log('❌ All task insertion attempts failed')
      }

      // 4. Verify the assignments were created
      const { data: verifyTasks, error: verifyError } = await supabase
        .from('project_tasks')
        .select('*')
        .not('assigned_to', 'is', null)

      if (!verifyError) {
        console.log(`✅ Verification: Found ${verifyTasks?.length || 0} assigned tasks in database`)
        if (verifyTasks && verifyTasks.length > 0) {
          console.log('Sample task:', verifyTasks[0])
        }
      } else {
        console.log('❌ Verification failed:', verifyError.message)
      }
    }

    console.log('\n🎉 Project assignment creation completed!')

  } catch (error) {
    console.error('💥 Error creating project assignments:', error)
  }
}

// Run the assignment creation
createRealProjectAssignments().then(() => {
  console.log('\n✅ Assignment creation complete!')
  process.exit(0)
})