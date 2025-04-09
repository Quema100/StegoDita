const header = () => {
    const toggle = document.getElementById('mode-toggle');
    const body = document.body;

    const savedMode = localStorage.getItem('mode');
    if (savedMode) {
        body.classList.add(savedMode);
        toggle.checked = savedMode === 'dark-mode';
    } else {
        body.classList.add('light-mode');
    }

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            body.classList.replace('light-mode', 'dark-mode');
            localStorage.setItem('mode', 'dark-mode');
        } else {
            body.classList.replace('dark-mode', 'light-mode');
            localStorage.setItem('mode', 'light-mode');
        }
    });
};


window.onload = () => {
    header();
    if (window.location.pathname.toLowerCase().includes("encode")) encode(), console.log("encode");
    if (window.location.pathname.toLowerCase().includes("decode")) decode(), console.log("decode");
}