// Test Sonner Toast Integration

// Run this in the browser console to test if Sonner toasts are working:

// Test basic toast
toast("Hello World!")

// Test success toast
toast.success("Success!", { description: "This is a success message" })

// Test error toast  
toast.error("Error!", { description: "This is an error message" })

// Test warning toast
toast.warning("Warning!", { description: "This is a warning message" })

// Test loading toast
toast.loading("Loading...", { description: "Please wait" })

console.log("✅ Sonner toast tests completed. Check if toasts appeared on screen.")