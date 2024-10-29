// Export Notes Functionality
document.getElementById('exportButton').addEventListener('click', () => {
    chrome.storage.local.get({ notes: [] }, (data) => {
      const notes = data.notes;
      const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
  
      // Create a download link and click it to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = 'notes_export.json';
      a.click();
      URL.revokeObjectURL(url); // Clean up the object URL after download
    });
  });
  
  // Import Notes Functionality
  document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('importInput').click();
  });
  
  document.getElementById('importInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = JSON.parse(e.target.result);
          console.log("Imported Notes from File:", importedNotes); // Debugging line
  
          // Validate that imported data is an array of notes
          if (Array.isArray(importedNotes)) {
            chrome.storage.local.get({ notes: [] }, (data) => {
              const existingNotes = data.notes;
              const existingIds = new Set(existingNotes.map(note => note.id));
  
              // Filter out duplicates from imported notes based on unique identifiers
              const uniqueImportedNotes = importedNotes.filter(note =>
                !existingIds.has(note.id) &&
                !existingNotes.some(existingNote => 
                  existingNote.title === note.title && existingNote.link === note.link
                )
              );
  
              // Concatenate unique imported notes with existing notes
              const updatedNotes = existingNotes.concat(uniqueImportedNotes);
  
              chrome.storage.local.set({ notes: updatedNotes }, () => {
                alert("Notes imported successfully without duplicates!");
              });
            });
          } else {
            alert("Invalid file format. Please upload a valid JSON file.");
          }
        } catch (error) {
          console.error("Error parsing imported JSON:", error); // Debugging line
          alert("Failed to import notes. Invalid JSON format.");
        }
      };
      reader.readAsText(file);
    }
  });
  
  