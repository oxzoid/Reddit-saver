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

let allNotes = []; // Store all notes globally

// Function to save note to Chrome storage
function saveNote(note) {
  note.id = Date.now(); // Assign a unique ID based on timestamp
  allNotes.push(note);
  chrome.storage.local.set({ notes: allNotes }, () => {
    displayNotes();
  });
}

// Function to display notes with optional filtering
function displayNotes(filteredNotes = null, query = '') {
  const notesToDisplay = filteredNotes !== null ? filteredNotes : allNotes;
  const notesDiv = document.getElementById('notes');
  notesDiv.innerHTML = '';
  notesToDisplay.forEach((note) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';

    // Highlight matching text
    const highlightText = (text) => {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    };

    // Note content container
    const noteContentDiv = document.createElement('div');
    noteContentDiv.className = 'noteContent';
    noteContentDiv.innerHTML = `<div>
      <strong>${highlightText(note.title)}</strong>
      </div><br>
      <a href="${note.link}" target="_blank">Go to Post</a>
    `;

    // Make note clickable to open in new window
    noteContentDiv.style.cursor = 'pointer';
    noteContentDiv.addEventListener('click', () => {
      openNoteInWindow(note);
    });

    // Create delete button (minus sign)
    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteButton';
    deleteButton.textContent = '-'; // Unicode minus sign
    deleteButton.addEventListener('click', () => {
      deleteNoteById(note.id);
    });

    noteDiv.appendChild(noteContentDiv);
    noteDiv.appendChild(deleteButton);
    notesDiv.appendChild(noteDiv);
  });
}

// Function to load notes from storage
function loadNotes() {
  chrome.storage.local.get({ notes: [] }, (data) => {
    allNotes = data.notes;
    displayNotes();
  });
}

// Debounce function to limit search input processing
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Handle search input
const handleSearchInput = () => {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filteredNotes = allNotes.filter(note => {
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });
  displayNotes(filteredNotes, query);
};

document.getElementById('searchInput').addEventListener('input', debounce(handleSearchInput, 300));

// Function to delete a note by unique ID
function deleteNoteById(noteId) {
  allNotes = allNotes.filter(note => note.id !== noteId);
  chrome.storage.local.set({ notes: allNotes }, () => {
    displayNotes();
  });
}

// Function to open note in new window (like Sticky Notes)
function openNoteInWindow(note) {
  const url = chrome.runtime.getURL('note.html') +
    `?title=${encodeURIComponent(note.title)}&content=${encodeURIComponent(note.content)}&link=${encodeURIComponent(note.link)}&id=${note.id}`;
  
  chrome.windows.create({
    url: url,
    type: 'popup',
    width: 450,
    height: 600,
  });
}

// Load notes when popup opens
document.addEventListener('DOMContentLoaded', loadNotes);

// Content script function to get post data from Reddit
function getPostData() {
  const titleElement = document.querySelector('h1');
  const contentElement = document.querySelector('[data-test-id="post-content"]');

  const title = titleElement ? titleElement.innerText : 'No Title Found';
  const content = contentElement ? contentElement.innerText : 'No Content Found';
  const link = window.location.href;

  return { title, content, link };
}
