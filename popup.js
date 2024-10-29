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

// Utility function to escape special characters for regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to highlight matching text
function highlightText(text, query = '') {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Function to save note to Chrome storage
function saveNote(note) {
  // Retrieve existing notes from storage
  chrome.storage.local.get({ notes: [] }, (data) => {
    allNotes = data.notes;

    // Check for duplicates based on the note's link
    const isDuplicate = allNotes.some(existingNote => existingNote.link === note.link);
    if (isDuplicate) {
      alert('This note already exists.');
      return;
    }

    // Assign a unique ID to the note
    note.id = Date.now();

    // Add the new note to the existing notes
    allNotes.push(note);

    // Save the updated notes back to storage
    chrome.storage.local.set({ notes: allNotes }, () => {
      console.log("Note saved successfully!");
      displayNotes();
    });
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

    // Note content container
    const noteContentDiv = document.createElement('div');
    noteContentDiv.className = 'noteContent';
    noteContentDiv.innerHTML = `<div>
      <strong>${highlightText(note.title, query)}</strong>
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
    deleteButton.textContent = '-';
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

// Add event listener for deleteAllButton
document.getElementById('deleteAllButton').addEventListener('click', () => {
    allNotes = [];
    chrome.storage.local.set({ notes: {} }, () => {
      console.log("All notes have been deleted.");
      loadNotes();
      displayNotes();
    });
  }
);

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
  if(link.includes("reddit.com")){
  return { title, content, link };}
}
