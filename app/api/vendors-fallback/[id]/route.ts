import { NextRequest, NextResponse } from 'next/server'

// Static vendor data for emergency use when database connection fails
const DEMO_VENDORS = [
  {
    id: "b6a1b150-d2a2-4b9c-9bc5-73d94b4dcfc1",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Creative Carpenters",
    contact_person: "Anil Kumar",
    category: "Carpenter",
    email: "anil@creativecarpenters.com",
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
    address: "12 Wood Lane",
    city: "Mumbai",
    state: "Maharashtra",
    status: "active",
    notes: "Specializes in custom furniture.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "e5c21b90-f768-4f6e-8b2a-9a8f639c4e87",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Bright Sparks Electric",
    contact_person: "Sunita Sharma",
    category: "Electrician",
    email: "sunita@brightsparks.com",
    phone: "+919876543211",
    whatsapp_number: "+919876543211",
    address: "45 Power Grid Road",
    city: "Delhi",
    state: "Delhi",
    status: "active",
    notes: "All types of residential and commercial wiring.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "d3e45f78-c12a-4b67-9d35-8a7e6b432f10",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Perfect Plumbers",
    contact_person: "Rajesh Singh",
    category: "Plumber",
    email: "rajesh@perfectplumbers.in",
    phone: "+919876543212",
    whatsapp_number: "+919876543212",
    address: "78 Water Works",
    city: "Bangalore",
    state: "Karnataka",
    status: "active",
    notes: "24/7 emergency plumbing services.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "f9a2d3e4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Royal Coatings",
    contact_person: "Priya Patel",
    category: "Painter",
    email: "priya@royalcoatings.co",
    phone: "+919876543213",
    whatsapp_number: "+919876543213",
    address: "101 Color Street",
    city: "Chennai",
    state: "Tamil Nadu",
    status: "active",
    notes: "Interior and exterior painting experts.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Modern Flooring Co.",
    contact_person: "Vikram Reddy",
    category: "Flooring",
    email: "vikram@modernflooring.com",
    phone: "+919876543214",
    whatsapp_number: "+919876543214",
    address: "23 Tile Avenue",
    city: "Pune",
    state: "Maharashtra",
    status: "active",
    notes: "Provides marble, wood, and tile flooring options.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  }
];

// GET a single vendor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log('EMERGENCY MODE: Getting vendor details for ID:', id);
    
    const vendor = DEMO_VENDORS.find(v => v.id === id);
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      data: vendor,
      message: 'Vendor fetched successfully (EMERGENCY MODE)'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// UPDATE a vendor by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    console.log('EMERGENCY MODE: Updating vendor with ID:', id, body);
    
    const vendorIndex = DEMO_VENDORS.findIndex(v => v.id === id);
    
    if (vendorIndex === -1) {
      return NextResponse.json(
        { error: 'Vendor not found' }, 
        { status: 404 }
      );
    }
    
    // Simulate updating the vendor in memory
    const updatedVendor = {
      ...DEMO_VENDORS[vendorIndex],
      name: body.vendor_name || DEMO_VENDORS[vendorIndex].name,
      contact_person: body.contact_person ?? DEMO_VENDORS[vendorIndex].contact_person,
      category: body.category ?? DEMO_VENDORS[vendorIndex].category,
      email: body.email ?? DEMO_VENDORS[vendorIndex].email,
      phone: body.phone ?? DEMO_VENDORS[vendorIndex].phone,
      whatsapp_number: body.whatsapp_number ?? DEMO_VENDORS[vendorIndex].whatsapp_number,
      address: body.address ?? DEMO_VENDORS[vendorIndex].address,
      city: body.city ?? DEMO_VENDORS[vendorIndex].city,
      state: body.state ?? DEMO_VENDORS[vendorIndex].state,
      status: body.status ?? DEMO_VENDORS[vendorIndex].status,
      notes: body.notes ?? DEMO_VENDORS[vendorIndex].notes,
      updated_at: new Date().toISOString()
    };
    
    // In a real app, you would save this to the database
    // For emergency mode, we just return the updated data
    
    return NextResponse.json({
      data: updatedVendor,
      message: 'Vendor updated successfully (EMERGENCY MODE - changes not saved to database)'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' }, 
      { status: 500 }
    );
  }
}

// DELETE a vendor by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log('EMERGENCY MODE: Deleting vendor with ID:', id);
    
    const vendorIndex = DEMO_VENDORS.findIndex(v => v.id === id);
    
    if (vendorIndex === -1) {
      return NextResponse.json(
        { error: 'Vendor not found' }, 
        { status: 404 }
      );
    }
    
    // In a real app, you would delete from the database
    // For emergency mode, we just return success
    
    return NextResponse.json({
      message: 'Vendor deleted successfully (EMERGENCY MODE - changes not saved to database)'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' }, 
      { status: 500 }
    );
  }
}