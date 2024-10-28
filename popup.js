document.getElementById('saveButton').addEventListener('click', () => {
  // Send a message to the content script to get the post data
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: getPostData,
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          saveNote(results[0].result);
        } else {
          alert('Failed to retrieve post data.');
        }
      }
    );
  });
});

// Function to save note to Chrome storage
function saveNote(note) {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;
    notes.push(note);
    chrome.storage.local.set({ notes }, () => {
      displayNotes();
    });
  });
}

// Function to display notes
function displayNotes() {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notesDiv = document.getElementById('notes');
    notesDiv.innerHTML = '';
    data.notes.forEach((note, index) => {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';

      // Note content container
      const noteContentDiv = document.createElement('div');
      noteContentDiv.className = 'noteContent';
      noteContentDiv.innerHTML = `
        <strong>${note.title}</strong>
        <a href="${note.link}" target="_blank">Go to Post</a>
      `;

      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'deleteButton';
      deleteButton.textContent = '-'; // Unicode minus sign
      deleteButton.addEventListener('click', () => {
        deleteNote(index);
      });

      noteDiv.appendChild(noteContentDiv);
      noteDiv.appendChild(deleteButton);
      notesDiv.appendChild(noteDiv);
    });
  });
}

// Function to delete a note
function deleteNote(index) {
  chrome.storage.local.get({ notes: [] }, (data) => {
    const notes = data.notes;
    notes.splice(index, 1); // Remove the note at the given index
    chrome.storage.local.set({ notes }, () => {
      displayNotes(); // Refresh the notes display
    });
  });
}

// Load notes when popup opens
document.addEventListener('DOMContentLoaded', displayNotes);

// Content script function to get post data
function getPostData() {
  const titleElement = document.querySelector('h1');
  // const contentElement = document.querySelector('[data-test-id="post-content"]');

  const title = titleElement ? titleElement.innerText : 'No Title Found';
  // const content = contentElement ? contentElement.innerText : 'No Content Found';
  const link = window.location.href;
  if(link.includes("reddit.com")){
  return { title, link };}
  
}
