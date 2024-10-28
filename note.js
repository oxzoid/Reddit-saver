// Retrieve note data and index from URL parameters
const params = new URLSearchParams(window.location.search);
const title = decodeURIComponent(params.get('title'));
const content = decodeURIComponent(params.get('content'));
const link = params.get('link');
const index = parseInt(params.get('index'), 10);

// Set the content in the HTML elements
document.getElementById('noteTitle').value = title || 'No Title';
document.getElementById('noteContent').value = content || 'No Content';
document.getElementById('noteLink').href = link || '#';

document.getElementById('saveButton').addEventListener('click', () => {
  // Get updated content
  const updatedTitle = document.getElementById('noteTitle').value;
  const updatedContent = document.getElementById('noteContent').value;

  // Update the note in storage
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;
    if (index >= 0 && index < notes.length) {
      notes[index].title = updatedTitle;
      notes[index].content = updatedContent;
      chrome.storage.local.set({ notes }, () => {
        alert('Note updated successfully!');
      });
    }
  });
});
