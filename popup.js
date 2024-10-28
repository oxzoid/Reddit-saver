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
      `;

      // Make note clickable to open in new window
      noteContentDiv.style.cursor = 'pointer';
      noteContentDiv.addEventListener('click', () => {
        openNoteInWindow(note, index);
      });

      // Create delete button (minus sign)
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

// Function to open note in new window (like Sticky Notes)
function openNoteInWindow(note, index) {
  const url = chrome.runtime.getURL('note.html') +
    `?title=${encodeURIComponent(note.title)}&content=${encodeURIComponent(note.content)}&link=${encodeURIComponent(note.link)}&index=${index}`;

  chrome.windows.create({
    url: url,
    type: 'popup',
    width: 450,
    height: 600,
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

// Content script function to get post data from Reddit
function getPostData() {
  const titleElement = document.querySelector('h1');
  const contentElement = document.querySelector('[slot = "text-body"]');

  const title = titleElement ? titleElement.innerText : 'No Title Found';
  const content = contentElement ? contentElement.innerText : 'No Content Found';
  const link = window.location.href;
  if(link.includes("reddit.com")){
  return { title, content, link };}
}
