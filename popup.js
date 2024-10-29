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
async function saveNote(note) {
  try {
    // Retrieve existing notes from storage
    let data = await chrome.storage.local.get({ notes: [] });

    // Ensure data.notes is an array
    if (!Array.isArray(data.notes)) {
      data.notes = [];
    }
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
    await chrome.storage.local.set({ notes: allNotes });
    console.log("Note saved successfully!");
    displayNotes();
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Function to display notes with optional filtering
function displayNotes(filteredNotes = null, query = '') {
  const notesToDisplay = filteredNotes !== null ? filteredNotes : allNotes;

  if (!Array.isArray(notesToDisplay)) {
    console.error('notesToDisplay is not an array:', notesToDisplay);
    return;
  }

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
async function loadNotes() {
  try {
    let data = await chrome.storage.local.get({ notes: [] });
    if (!Array.isArray(data.notes)) {
      console.error('data.notes is not an array, resetting to empty array.');
      data.notes = [];
      await chrome.storage.local.set({ notes: data.notes });
    }
    allNotes = data.notes;
    displayNotes();
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

// Event listener for saveButton
document.getElementById('saveButton').addEventListener('click', () => {
  // Send a message to the content script to get the post data
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: getPostData,
      });
      if (results && results[0] && results[0].result) {
        saveNote(results[0].result);
      } else {
        alert('Failed to retrieve post data.');
      }
    } catch (error) {
      console.error('Error executing script:', error);
    }
  });
});

// Event listener for deleteAllButton
document.getElementById('deleteAllButton').addEventListener('click', () => {
  // Show the custom confirmation modal
  document.getElementById('confirmationModal').style.display = 'block';
});

// Event listener for the confirm delete button
// Event listener for the confirm delete button
document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
  try {
    // Clear all notes
    allNotes = [];
    await chrome.storage.local.set({ notes: allNotes });
    console.log("All notes have been deleted.");

    // Verify storage after deletion
    let data = await chrome.storage.local.get('notes');
    console.log("Notes in storage after deletion:", data.notes);

    displayNotes();
    // Hide the modal
    document.getElementById('confirmationModal').style.display = 'none';
  } catch (error) {
    console.error('Error deleting all notes:', error);
  }
});

// Event listener for the cancel delete button
document.getElementById('cancelDeleteButton').addEventListener('click', () => {
  // Hide the modal
  document.getElementById('confirmationModal').style.display = 'none';
});

// Search Input Event Listener
document.getElementById('searchInput').addEventListener('input', debounce(handleSearchInput, 300));

// Load notes when popup opens
document.addEventListener('DOMContentLoaded', loadNotes);

// Debounce function to limit search input processing
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Handle search input
function handleSearchInput() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filteredNotes = allNotes.filter((note) => {
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });
  displayNotes(filteredNotes, query);
}

// Function to delete a note by unique ID
async function deleteNoteById(noteId) {
  try {
    allNotes = allNotes.filter((note) => note.id !== noteId);
    await chrome.storage.local.set({ notes: allNotes });
    displayNotes();
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

// Function to open note in new window (like Sticky Notes)
function openNoteInWindow(note) {
  const url =
    chrome.runtime.getURL('note.html') +
    `?title=${encodeURIComponent(note.title)}&content=${encodeURIComponent(
      note.content
    )}&link=${encodeURIComponent(note.link)}&id=${note.id}`;

  chrome.windows.create({
    url: url,
    type: 'popup',
    width: 450,
    height: 600,
  });
}

// Content script function to get post data from Reddit
function getPostData() {
  const titleElement = document.querySelector('h1');
  const contentElement = document.querySelector('[slot ="text-body"]');

  const title = titleElement ? titleElement.innerText : 'No Title Found';
  const content = contentElement ? contentElement.innerText : 'No Content Found';
  const link = window.location.href;

  if (link.includes('reddit.com')) {
    return { title, content, link };
  }
}
