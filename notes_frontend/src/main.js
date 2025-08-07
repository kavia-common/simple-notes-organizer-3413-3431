import './style.css';

/**
 * Utility functions for interacting with localStorage for note persistance
 */
const NOTE_KEY = 'notes_app_notes';
// PUBLIC_INTERFACE
function getNotes() {
  /** Returns all notes from localStorage */
  const notes = JSON.parse(localStorage.getItem(NOTE_KEY) || '[]');
  // Sort notes by updatedAt desc
  notes.sort((a, b) => b.updatedAt - a.updatedAt);
  return notes;
}

// PUBLIC_INTERFACE
function saveNotes(notes) {
  /** Saves all notes to localStorage */
  localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
}

// PUBLIC_INTERFACE
function createNote({ title, content }) {
  /** Create a new note and persist */
  const notes = getNotes();
  const newNote = {
    id: Date.now().toString(),
    title,
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.unshift(newNote);
  saveNotes(notes);
  return newNote;
}

// PUBLIC_INTERFACE
function updateNote(id, { title, content }) {
  /** Update note by id */
  const notes = getNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx >= 0) {
    notes[idx] = {
      ...notes[idx],
      title,
      content,
      updatedAt: Date.now(),
    };
    saveNotes(notes);
    return notes[idx];
  }
  return null;
}

// PUBLIC_INTERFACE
function deleteNote(id) {
  /** Delete note by id */
  let notes = getNotes();
  notes = notes.filter((n) => n.id !== id);
  saveNotes(notes);
}

/* getNote function removed as it was not used to resolve lint error */

/**
 * Rendering and UI logic
 */
function createElement(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([key, val]) => {
    if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.substring(2).toLowerCase(), val);
    } else if (key === 'className') {
      el.className = val;
    } else if (key === 'for') {
      el.htmlFor = val;
    } else if (val != null) {
      el.setAttribute(key, val);
    }
  });
  for (let child of children) {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  }
  return el;
}

// App state
let selectedNoteId = null;
let editing = false;

/**
 * Renders the top navigation bar
 */
function TopNav() {
  const newNoteBtn = createElement(
    'button',
    {
      className: 'add-btn',
      title: 'New note',
      onClick: () => {
        editing = true;
        selectedNoteId = null;
        render();
      }
    },
    '+ New'
  );
  const appTitle = createElement('span', { className: 'app-title' }, 'Simple Notes');
  return createElement('nav', { className: 'topnav' }, appTitle, newNoteBtn);
}

/**
 * Renders the sidebar with the notes list
 */
function Sidebar(notes) {
  const list = createElement('ul', { className: 'notes-list' });

  if (notes.length === 0) {
    list.appendChild(createElement('li', { className: "notes-list-empty" }, 'No notes yet.'));
  }
  notes.forEach((note) => {
    const isSelected = note.id === selectedNoteId;
    const item = createElement(
      'li',
      {
        className: `notes-list-item${isSelected ? ' selected' : ''}`,
        tabIndex: 0,
        onClick: () => {
          selectedNoteId = note.id;
          editing = false;
          render();
        },
        onKeydown: (e) => {
          if (e.key === 'Enter') {
            selectedNoteId = note.id;
            editing = false;
            render();
          }
        }
      },
      createElement('div', { className: 'note-title' }, note.title || '(Untitled)'),
      createElement('div', { className: 'note-meta' }, new Date(note.updatedAt).toLocaleString())
    );
    list.appendChild(item);
  });

  return createElement('aside', { className: 'sidebar' }, list);
}

/**
 * Renders the main detail area, either showing note details, edit form, or a placeholder.
 */
function MainDetail(notes) {
  const main = createElement('main', { className: 'main-area' });
  if (editing) {
    // Edit/New form
    let formTitle = '';
    let formContent = '';
    if (selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) {
        formTitle = note.title;
        formContent = note.content;
      }
    }
    const titleInput = createElement('input', {
      type: 'text',
      className: 'note-input',
      placeholder: 'Title',
      value: formTitle,
      required: true,
      id: 'edit-title'
    });
    const contentInput = createElement('textarea', {
      className: 'note-input area',
      rows: 12,
      placeholder: 'Note details...',
      id: 'edit-content'
    }, formContent || '');
    contentInput.value = formContent;

    const saveBtn = createElement(
      'button',
      {
        className: 'primary-btn',
        type: 'submit'
      },
      'Save'
    );
    const cancelBtn = createElement(
      'button',
      {
        className: 'secondary-btn',
        type: 'button',
        onClick: () => {
          editing = false;
          render();
        }
      },
      'Cancel'
    );

    const form = createElement('form', {
      className: 'note-form',
      onSubmit: (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title) {
          window.alert('Title cannot be empty.');
          return;
        }
        if (selectedNoteId) {
          updateNote(selectedNoteId, { title, content });
        } else {
          const newNote = createNote({ title, content });
          selectedNoteId = newNote.id;
        }
        editing = false;
        render();
      }
    }, titleInput, contentInput, createElement('div', { className: "form-actions" }, saveBtn, cancelBtn));
    main.appendChild(form);
  } else if (selectedNoteId) {
    // Show Note Details
    const note = notes.find(n => n.id === selectedNoteId);
    if (!note) {
      main.appendChild(createElement('div', { className: 'note-placeholder' }, 'Note not found'));
      return main;
    }
    const editBtn = createElement(
      'button',
      {
        className: 'secondary-btn',
        onClick: () => {
          editing = true;
          render();
        }
      },
      'Edit'
    );
    const delBtn = createElement(
      'button',
      {
        className: 'danger-btn',
        onClick: () => {
          if (
            window.confirm('Are you sure you want to delete this note?')
          ) {
            deleteNote(note.id);
            selectedNoteId = null;
            editing = false;
            render();
          }
        }
      },
      'Delete'
    );
    main.appendChild(
      createElement('div', { className: 'note-view' },
        createElement('h2', {}, note.title),
        createElement('div', { className: 'note-meta' }, 'Last edited: ' + new Date(note.updatedAt).toLocaleString()),
        createElement('p', { className: 'note-content' }, note.content ? note.content : createElement('em', {}, '(No content)')),
        createElement('div', { className: 'note-actions' }, editBtn, delBtn)
      )
    );
  } else {
    // Placeholder
    main.appendChild(
      createElement('div', { className: 'note-placeholder' },
        'Select a note or create a new one to get started!'
      )
    );
  }
  return main;
}

/**
 * Root render function
 */
function render() {
  const notes = getNotes();
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(TopNav());
  const mainContent = createElement('div', { className: 'layout' },
    Sidebar(notes),
    MainDetail(notes)
  );
  app.appendChild(mainContent);
}

window.addEventListener('DOMContentLoaded', render);
