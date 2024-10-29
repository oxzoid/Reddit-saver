document.addEventListener('DOMContentLoaded', function () {
  // Get parameters from the URL
  const params = new URLSearchParams(window.location.search);
  const titleParam = params.get('title');
  const contentParam = params.get('content');
  const linkParam = params.get('link');

  // Decode the parameters (URLSearchParams automatically decodes percent-encoded characters)
  const title = titleParam || 'No Title Found';
  const content = contentParam || '<p>No Content Found</p>';
  const link = linkParam || '#';


  // Sanitize the content

  // Set the title and sanitized content
  document.getElementById('noteTitle').innerText = title;
  document.getElementById('noteContent').innerHTML = content;
  document.getElementById('originalLink').href = link;
});
