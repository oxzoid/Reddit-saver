// Retrieve note data and id from URL parameters
const params = new URLSearchParams(window.location.search);
const title = decodeURIComponent(params.get('title'));
const content = decodeURIComponent(params.get('content'));
const link = params.get('link');
const noteId = parseInt(params.get('id'), 10);

console.log('Loaded Note Data:', { title, content, link, noteId }); // Debugging

// Set the content in the HTML elements
document.getElementById('noteTitle').value = title || 'No Title';
document.getElementById('noteContent').value = content || 'No Content';
document.getElementById('noteLink').href = link || '#';

// Event listener to save changes when the button is clicked
document.getElementById('saveButton').addEventListener('click', () => {
  // Get updated content
  const updatedTitle = document.getElementById('noteTitle').value;
  const updatedContent = document.getElementById('noteContent').value;

  console.log('Attempting to Save Changes:', { updatedTitle, updatedContent, noteId }); // Debugging

  // Retrieve the notes from storage
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;
    console.log('Existing Notes in Storage:', notes); // Debugging

    // Find the note to update based on its ID
    const noteIndex = notes.findIndex(note => note.id === noteId);
    console.log('Note Index Found:', noteIndex); // Debugging

    if (noteIndex !== -1) {
      // Update the note's title and content
      notes[noteIndex].title = updatedTitle;
      notes[noteIndex].content = updatedContent;

      console.log('Updated Note:', notes[noteIndex]); // Debugging

      // Save the updated notes back to storage
      chrome.storage.local.set({ notes }, () => {
        console.log('Notes successfully updated in storage!'); // Debugging
        alert('Note updated successfully!');
        // Optionally, close the window after saving
        window.close();
      });
    } else {
      console.error('Error: Note not found.');
      alert('Error: Note not found.');
    }
  });
});
