const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixProjectPhases() {
  console.log('🔧 Fixing project-phase relationships...\n')
  
  try {
    // Get all projects and phases
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, user_id')
    
    const { data: allPhases } = await supabase
      .from('project_phases')
      .select('*')
    
    console.log('Projects:', projects?.length || 0)
    console.log('Phases:', allPhases?.length || 0)
    
    if (projects && projects.length > 0) {
      for (const project of projects) {
        console.log(`\n📋 Project: ${project.name} (${project.id})`)
        
        // Get existing phases for this project
        const { data: existingPhases } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', project.id)
          .order('position')
        
        console.log(`  Existing phases: ${existingPhases?.length || 0}`)
        
        if (!existingPhases || existingPhases.length === 0) {
          console.log('  🆕 Creating default phases for project...')
          
          const defaultPhases = [
            { name: 'Int', position: 0 },
            { name: 'Cement', position: 1 },
            { name: 'Plaster', position: 2 },
            { name: 'Ready ghar', position: 3 }
          ]
          
          for (const phaseTemplate of defaultPhases) {
            const { data: newPhase, error } = await supabase
              .from('project_phases')
              .insert({
                user_id: project.user_id,
                project_id: project.id,
                name: phaseTemplate.name,
                position: phaseTemplate.position,
                status: 'pending'
              })
              .select()
              .single()
            
            if (error) {
              console.error(`    ❌ Failed to create ${phaseTemplate.name}:`, error.message)
            } else {
              console.log(`    ✅ Created ${phaseTemplate.name}`)
            }
          }
        } else {
          console.log(`  ✅ Phases already exist:`, existingPhases.map(p => p.name).join(', '))
        }
      }
    }
    
    // Now test task creation again
    console.log('\n🧪 Testing task creation...')
    const testProject = projects?.[0]
    if (testProject) {
      const { data: phases } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', testProject.id)
        .order('position')
      
      if (phases && phases.length > 0) {
        const intPhase = phases.find(p => p.name === 'Int') || phases[0]
        console.log(`Creating test task in ${intPhase.name} phase...`)
        
        const { data: testTask, error: taskError } = await supabase
          .from('project_tasks')
          .insert({
            project_id: testProject.id,
            phase_id: intPhase.id,
            name: 'Test Task in Int',
            description: 'Testing phase assignment',
            status: 'pending',
            priority: 'medium',
            estimated_hours: 1,
            actual_hours: 0,
            completion_percentage: 0
          })
          .select()
          .single()
        
        if (taskError) {
          console.error('❌ Task creation failed:', taskError)
        } else {
          console.log('✅ Task created successfully:', testTask.name)
          console.log(`   Phase ID: ${testTask.phase_id}`)
          
          // Clean up
          await supabase.from('project_tasks').delete().eq('id', testTask.id)
          console.log('🧹 Test task cleaned up')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixProjectPhases()