import React from "react";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

// ... existing code ...

if (loading) {
  return (
    <div className="flex justify-center items-center h-40">
      <OptimizedLoadingSpinner
        size="medium"
        text="Chargement des rendez-vous..."
      />
    </div>
  );
}

// ... rest of the existing code ...
