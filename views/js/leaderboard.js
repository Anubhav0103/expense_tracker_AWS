async function loadLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard data');
    }
    const data = await response.json();
    
    const tbody = document.querySelector('#leaderboard-table tbody');
    tbody.innerHTML = '';
    
    data.forEach((user, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="rank">#${index + 1}</td>
        <td>${user.name}</td>
        <td>₹${user.total_expenses}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    alert('Failed to load leaderboard data');
  }
}

document.addEventListener('DOMContentLoaded', loadLeaderboard); 