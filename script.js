document.addEventListener('DOMContentLoaded', () => {
    
    const fileItems = document.querySelectorAll('.file-item');
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');
    const breadcrumb = document.getElementById('current-file-breadcrumb');

    function switchTab(targetId) {
        fileItems.forEach(item => item.classList.remove('active'));
        const activeFile = document.querySelector(`.file-item[data-target="${targetId}"]`);
        if(activeFile) activeFile.classList.add('active');

        tabs.forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`.tab[data-target="${targetId}"]`);
        if(activeTab) {
            activeTab.style.display = '';
            activeTab.classList.add('active');
            breadcrumb.textContent = activeTab.textContent.replace('×', '').trim();
        }

        panels.forEach(panel => panel.classList.remove('active'));
        const activePanel = document.getElementById(`panel-${targetId}`);
        if(activePanel) {
            activePanel.classList.add('active');
            window.dispatchEvent(new Event('resize'));
        }
    }

    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.target);
        });
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.target);
        });
    });

    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('clock').textContent = timeString;
    }
    
    setInterval(updateClock, 1000);
    updateClock();

    function initThreeJS() {
        const container = document.getElementById('threejs-container');
        if (!container) return;

        const scene = new THREE.Scene();
        
        const aspect = container.clientWidth > 0 ? container.clientWidth / container.clientHeight : 1;
        const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        camera.position.z = 4;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 800;
        const posArray = new Float32Array(particlesCount * 3);

        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x0ea5e9,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        window.addEventListener('resize', () => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        });

        let mouseX = 0;
        let mouseY = 0;

        container.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) - 0.5;
            mouseY = (event.clientY / window.innerHeight) - 0.5;
        });

        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            particlesMesh.rotation.y = elapsedTime * 0.05;
            particlesMesh.rotation.x = elapsedTime * 0.02;

            particlesMesh.position.x += (mouseX * 0.5 - particlesMesh.position.x) * 0.05;
            particlesMesh.position.y += (-mouseY * 0.5 - particlesMesh.position.y) * 0.05;
            
            renderer.render(scene, camera);
        }
        
        animate();
    }

    setTimeout(initThreeJS, 100);

    const commandPalette = document.getElementById('command-palette');
    const commandInput = document.getElementById('command-input');
    const commandList = document.getElementById('command-list');
    const commandItems = Array.from(document.querySelectorAll('.command-item'));
    const searchIcon = document.querySelector('.activity-icon[title="Search"]');

    let lastActiveFileIcon = document.querySelector('.activity-icon[title="Explorer"]');
    document.querySelectorAll('.activity-icon[title="Explorer"], .activity-icon[title="Source Control"], .activity-icon[title="Run and Debug"], .activity-icon[title="Extensions"]').forEach(icon => {
        icon.addEventListener('click', () => {
            lastActiveFileIcon = icon;
            if (window.abortBugSmasher && icon.id !== 'activity-debug-toggle') {
                window.abortBugSmasher();
            }
        });
    });
    
    function openCommandPalette() {
        commandPalette.classList.add('active');
        commandInput.value = '';
        commandInput.focus();
        filterCommands('');
        document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
        if (searchIcon) searchIcon.classList.add('active');
    }

    function closeCommandPalette() {
        commandPalette.classList.remove('active');
        if (searchIcon) searchIcon.classList.remove('active');
        if (lastActiveFileIcon) lastActiveFileIcon.classList.add('active');
    }

    if (searchIcon) {
        searchIcon.addEventListener('click', openCommandPalette);
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            openCommandPalette();
        }
        if (e.key === 'Escape') {
            closeCommandPalette();
        }
    });

    commandPalette.addEventListener('click', (e) => {
        if (e.target === commandPalette) {
            closeCommandPalette();
        }
    });

    function filterCommands(query) {
        query = query.toLowerCase();
        let firstVisible = null;
        
        commandItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.classList.remove('selected');
            
            if (text.includes(query)) {
                item.style.display = 'flex';
                if (!firstVisible) firstVisible = item;
            } else {
                item.style.display = 'none';
            }
        });
        
        if (firstVisible) {
            firstVisible.classList.add('selected');
        }
    }

    commandInput.addEventListener('input', (e) => {
        filterCommands(e.target.value);
    });

    commandItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.target);
            closeCommandPalette();
            lucide.createIcons();
        });
    });

    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const selected = commandList.querySelector('.command-item.selected');
            if (selected) {
                switchTab(selected.dataset.target);
                closeCommandPalette();
                lucide.createIcons();
            }
        }
    });

    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalBody = document.getElementById('terminal-body');
    const terminalPanel = document.getElementById('terminal-panel');
    const closeTerminalBtn = document.getElementById('close-terminal');
    const clearTerminalBtn = document.getElementById('clear-terminal-btn');

    terminalBody.addEventListener('click', () => {
        terminalInput.focus();
    });

    function syncTerminalIcon() {
        const isOpen = !terminalPanel.classList.contains('hidden');
        if (activityTerminalToggle) {
            activityTerminalToggle.classList.toggle('terminal-open', isOpen);
        }
        const titleBarTerminalToggle = document.getElementById('title-bar-terminal-toggle');
        if (titleBarTerminalToggle) {
            titleBarTerminalToggle.classList.toggle('active', isOpen);
        }
        const titleBarFile = document.getElementById('title-bar-file');
        if (titleBarFile) {
            titleBarFile.classList.toggle('active', !isOpen);
        }

        if (!isOpen && window.abortBugSmasher) {
            window.abortBugSmasher();
            const debugToggle = document.getElementById('activity-debug-toggle');
            if (debugToggle && debugToggle.classList.contains('active')) {
                debugToggle.classList.remove('active');
                const explorerIcon = document.querySelector('.activity-icon[title="Explorer"]');
                if (explorerIcon) explorerIcon.classList.add('active');
            }
        }
    }

    const titleBarTerminalToggle = document.getElementById('title-bar-terminal-toggle');
    if (titleBarTerminalToggle) {
        titleBarTerminalToggle.addEventListener('click', () => {
            terminalPanel.classList.toggle('hidden');
            syncTerminalIcon();
            if (!terminalPanel.classList.contains('hidden')) {
                terminalInput.focus();
            }
        });
    }

    const activityTerminalToggle = document.getElementById('activity-terminal-toggle');
    if (activityTerminalToggle) {
        activityTerminalToggle.addEventListener('click', () => {
            terminalPanel.classList.toggle('hidden');
            const isOpen = !terminalPanel.classList.contains('hidden');
            activityTerminalToggle.classList.toggle('terminal-open', isOpen);
            if (isOpen) {
                terminalInput.focus();
            }
        });
    }

    const closeTabButtons = document.querySelectorAll('.close-tab');
    closeTabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tab = e.target.closest('.tab');
            tab.style.display = 'none';

            if (tab.classList.contains('active')) {
                const visibleTabs = Array.from(document.querySelectorAll('.tab')).filter(t => t.style.display !== 'none');
                if (visibleTabs.length > 0) {
                    switchTab(visibleTabs[0].dataset.target);
                } else {
                    panels.forEach(p => p.classList.remove('active'));
                    breadcrumb.textContent = '';
                }
            }
        });
    });


    closeTerminalBtn.addEventListener('click', () => {
        terminalPanel.classList.add('hidden');
        syncTerminalIcon();
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '`') {
            e.preventDefault();
            terminalPanel.classList.toggle('hidden');
            syncTerminalIcon();
            if (!terminalPanel.classList.contains('hidden')) {
                terminalInput.focus();
            }
        }
    });

    clearTerminalBtn.addEventListener('click', () => {
        terminalOutput.innerHTML = '';
        terminalInput.focus();
    });

    function printToTerminal(text, className = '') {
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.innerHTML = text;
        terminalOutput.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = terminalInput.value.trim();
            if (!val) return;

            printToTerminal(`<span class="terminal-prompt">albin@portfolio</span>:<span class="term-dir">~/portfolio$</span> ${val}`);
            
            terminalInput.value = '';
            processCommand(val.toLowerCase());
        }
    });

    const asciiArt = `
  _   _ _                  _ _ _     _         _  
 | | | (_)_ __ ___    __ _| | | |__ (_)_ __   | | 
 | |_| | | '__/ _ \\  / _\` | | | '_ \\| | '_ \\  | | 
 |  _  | | | |  __/ | (_| | | | |_) | | | | | |_| 
 |_| |_|_|_|  \\___|  \\__,_|_|_|_.__/|_|_| |_| (_) 
    `;

    function processCommand(cmd) {
        if (cmd === 'help') {
            printToTerminal(`Available commands:
  <span class="term-highlight">whoami</span>       - Display brief info about me
  <span class="term-highlight">open [tab]</span>   - Open a specific tab (e.g. open projects, open contact)
  <span class="term-highlight">clear</span>        - Clear terminal output
  <span class="term-highlight">date</span>         - Show current date/time
  <span class="term-highlight">sudo hire albin</span>- ???
            `);
        } 
        else if (cmd === 'whoami') {
            printToTerminal(`Albin A P: Passionate Android Developer. Master of Kotlin and Jetpack Compose.`);
        }
        else if (cmd === 'clear') {
            terminalOutput.innerHTML = '';
        }
        else if (cmd === 'date') {
            printToTerminal(new Date().toString());
        }
        else if (cmd.startsWith('open ')) {
            const target = cmd.split(' ')[1];
            const validTargets = ['home', 'about', 'skills', 'projects', 'experience', 'contact'];
            if (validTargets.includes(target)) {
                switchTab(target);
                printToTerminal(`Opening <span class="term-highlight">${target}</span>...`, 'term-success');
            } else {
                printToTerminal(`Error: File or tab '${target}' not found.`, 'term-error');
            }
        }
        else if (cmd === 'sudo hire albin' || cmd === 'hire albin') {
            printToTerminal(`<pre class="term-success" style="font-size: 10px;">${asciiArt}</pre>`);
            printToTerminal(`ACCESS GRANTED. Firing confetti!`, 'term-success');
            
            if (typeof confetti === 'function') {
                var duration = 3000;
                var end = Date.now() + duration;
                (function frame() {
                    confetti({
                        particleCount: 5,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ['#0ea5e9', '#c084fc', '#f472b6']
                    });
                    confetti({
                        particleCount: 5,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ['#0ea5e9', '#c084fc', '#f472b6']
                    });
                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());
            }
        }
        else {
            printToTerminal(`${cmd}: command not found. Type 'help' to see available commands.`, 'term-error');
        }
    }

    const extensionsData = {
        kotlin: {
            name: 'Kotlin Language Support',
            publisher: 'JetBrains',
            version: '1.9.22',
            color: '#7F52FF',
            icon: 'codicon-symbol-class',
            rating: '★★★★★',
            downloads: '2.4M',
            tags: ['Kotlin', 'Android', 'JVM', 'Language'],
            description: `Full Kotlin language support — the primary language used in every Android project. Albin uses Kotlin for all modern Android development, leveraging its null-safety, coroutines, and expressive syntax to write clean, maintainable code.`,
            changelog: `v1.9.22 — Improved coroutine analysis and Compose compiler plugin support.`
        },
        compose: {
            name: 'Jetpack Compose Preview',
            publisher: 'Google',
            version: '1.6.0',
            color: '#4285F4',
            icon: 'codicon-layout',
            rating: '★★★★★',
            downloads: '1.8M',
            tags: ['Compose', 'UI', 'Android', 'Declarative'],
            description: `Jetpack Compose is Android's modern toolkit for building native UI. Albin is experienced in building complex, animated UIs entirely in Compose, replacing XML layouts with concise and reactive Kotlin code.`,
            changelog: `v1.6.0 — Stable release with enhanced animation APIs.`
        },
        firebase: {
            name: 'Firebase Tools',
            publisher: 'Google',
            version: '12.0.1',
            color: '#FFCA28',
            textColor: '#333',
            icon: 'codicon-database',
            rating: '★★★★☆',
            downloads: '3.1M',
            tags: ['Firebase', 'Auth', 'Firestore', 'Cloud'],
            description: `Firebase provides real-time databases, authentication, cloud functions, and more. Albin has integrated Firebase Auth, Firestore, and Cloud Messaging into production Android applications.`,
            changelog: `v12.0.1 — Updated Firestore offline persistence and improved auth flows.`
        },
        retrofit: {
            name: 'Retrofit HTTP Client',
            publisher: 'Square',
            version: '2.9.0',
            color: '#48BB78',
            icon: 'codicon-cloud',
            rating: '★★★★★',
            downloads: '980K',
            tags: ['REST', 'Networking', 'OkHttp', 'API'],
            description: `Retrofit is a battle-tested, type-safe HTTP client for Android. Albin uses Retrofit with OkHttp and Gson converters to connect Android apps to REST APIs reliably and efficiently.`,
            changelog: `v2.9.0 — Added Kotlin suspend function support for coroutine-based calls.`
        },
        room: {
            name: 'Room Database',
            publisher: 'Google',
            version: '2.6.1',
            color: '#ED8936',
            icon: 'codicon-server',
            rating: '★★★★★',
            downloads: '1.2M',
            tags: ['SQLite', 'Offline', 'Persistence', 'DAO'],
            description: `Room provides an abstraction layer over SQLite for robust local data storage. Albin uses Room with DAOs and Flow to build fully offline-capable Android apps with reactive data streams.`,
            changelog: `v2.6.1 — Improved migration support and KSP compatibility.`
        },
        hilt: {
            name: 'Hilt Dependency Injection',
            publisher: 'Google',
            version: '2.50',
            color: '#F56565',
            icon: 'codicon-package',
            rating: '★★★★★',
            downloads: '760K',
            tags: ['DI', 'Architecture', 'MVVM', 'Clean Code'],
            description: `Hilt is Google's recommended DI solution built on Dagger. Albin applies Hilt across all project layers — ViewModels, Repositories, and Use Cases — to ensure scalable, testable, and decoupled architectures.`,
            changelog: `v2.50 — Full Kotlin Symbol Processing (KSP) support added.`
        }
    };

    const sidebarExplorer = document.getElementById('sidebar-explorer');
    const sidebarExtensions = document.getElementById('sidebar-extensions');
    const extItems = document.querySelectorAll('.ext-item');
    const extSearch = document.getElementById('ext-search');
    const extDetailContent = document.getElementById('ext-detail-content');
    const extensionsActivityIcon = document.querySelector('.activity-icon[title="Extensions"]');
    const explorerActivityIcon = document.querySelector('.activity-icon[title="Explorer"]');

    function showExtensionDetail(extKey) {
        const ext = extensionsData[extKey];
        if (!ext) return;

        extItems.forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`.ext-item[data-ext="${extKey}"]`);
        if (activeItem) activeItem.classList.add('active');

        panels.forEach(p => p.classList.remove('active'));
        document.getElementById('panel-extension-detail').classList.add('active');

        extDetailContent.innerHTML = `
            <div class="ext-detail-page">
                <div class="ext-detail-banner">
                    <div class="ext-detail-logo" style="background:${ext.color}; color:${ext.textColor || '#fff'};">
                        <i class="codicon ${ext.icon}" style="font-size:38px;"></i>
                    </div>
                    <div>
                        <div class="ext-detail-title">${ext.name}</div>
                        <div class="ext-detail-meta">${ext.publisher} &nbsp;|&nbsp; v${ext.version} &nbsp;|&nbsp; ${ext.downloads} installs</div>
                        <div class="ext-detail-rating">${ext.rating}</div>
                        <button class="ext-install-btn"><i class="codicon codicon-check"></i> Installed</button>
                    </div>
                </div>
                <div class="ext-detail-body">
                    <div class="ext-tags">
                        ${ext.tags.map(t => `<span class="ext-tag">${t}</span>`).join('')}
                    </div>
                    <h3>About</h3>
                    <p>${ext.description}</p>
                    <h3>Changelog</h3>
                    <p>${ext.changelog}</p>
                </div>
            </div>
        `;

        breadcrumb.textContent = ext.name;
    }

    extItems.forEach(item => {
        item.addEventListener('click', () => {
            showExtensionDetail(item.dataset.ext);
        });
    });

    if (extSearch) {
        extSearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            extItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(q) ? 'flex' : 'none';
            });
        });
    }

    if (extensionsActivityIcon) {
        extensionsActivityIcon.addEventListener('click', () => {
            sidebarExplorer.style.display = 'none';
            sidebarExtensions.style.display = 'block';
            document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
            extensionsActivityIcon.classList.add('active');
        });
    }

    if (explorerActivityIcon) {
        explorerActivityIcon.addEventListener('click', () => {
            sidebarExtensions.style.display = 'none';
            sidebarExplorer.style.display = 'block';
            document.querySelectorAll('.activity-icon').forEach(i => i.classList.remove('active'));
            explorerActivityIcon.classList.add('active');
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i data-lucide="loader" size="16"></i>';
            lucide.createIcons();
            
            fetch(contactForm.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: new FormData(contactForm)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success === "true" || data.success === true) {
                    contactForm.reset();
                    
                    submitBtn.innerHTML = 'Sent! <i data-lucide="check-circle" size="16"></i>';
                    submitBtn.style.background = '#23d18b';
                    lucide.createIcons();
                    
                    if (typeof printToTerminal === 'function') {
                        terminalPanel.classList.remove('hidden');
                        syncTerminalIcon();
                        printToTerminal(`Message successfully dispatched to albinap952654@gmail.com!`, 'term-success');
                    }
                    
                    setTimeout(() => {
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.style.background = '';
                        lucide.createIcons();
                    }, 3000);
                } else {
                    throw new Error('Server returned false success');
                }
            })
            .catch(error => {
                submitBtn.innerHTML = 'Error Sending <i data-lucide="x-circle" size="16"></i>';
                submitBtn.style.background = '#f48771';
                lucide.createIcons();
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.style.background = '';
                    lucide.createIcons();
                }, 3000);
            });
        });
    }

    const emailMeBtn = document.getElementById('email-me-btn');
    if (emailMeBtn) {
        emailMeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const originalHTML = emailMeBtn.innerHTML;
            
            emailMeBtn.innerHTML = '<i data-lucide="check"></i> albinap952654@gmail.com';
            lucide.createIcons();
            
            navigator.clipboard.writeText('albinap952654@gmail.com').catch(() => {});
            
            setTimeout(() => {
                emailMeBtn.innerHTML = originalHTML;
                lucide.createIcons();
            }, 2000);
        });
    }

    const debugToggle = document.getElementById('activity-debug-toggle');
    let isDebugging = false;
    let bugsSquashed = 0;
    const totalBugs = 6;
    let activeIntervals = [];

    window.abortBugSmasher = function() {
        if (!isDebugging) return;
        isDebugging = false;
        activeIntervals.forEach(interval => clearInterval(interval));
        activeIntervals = [];
        document.querySelectorAll('.bug-icon').forEach(bug => bug.remove());
        if (typeof printToTerminal === 'function') {
            printToTerminal(`> Debug Session Aborted.`, 'term-error');
        }
    };

    if (debugToggle) {
        debugToggle.addEventListener('click', () => {
            if (isDebugging) return;
            isDebugging = true;
            bugsSquashed = 0;

            document.querySelectorAll('.activity-icon').forEach(icon => icon.classList.remove('active'));
            debugToggle.classList.add('active');

            if (terminalPanel.classList.contains('hidden')) {
                terminalPanel.classList.remove('hidden');
                syncTerminalIcon();
            }

            if (typeof printToTerminal === 'function') {
                printToTerminal(`> Debug Session Started: Squashing bugs in Albin_Portfolio.kt...`, 'term-info');
                setTimeout(() => printToTerminal(`> CRITICAL: ${totalBugs} elusive bugs detected! Squish them!`, 'term-error'), 800);
            }

            setTimeout(() => {
                for (let i = 0; i < totalBugs; i++) {
                    spawnBug();
                }
            }, 1500);
        });
    }

    function spawnBug() {
        const bug = document.createElement('div');
        const bugIcons = ['🐞', '🪲', '🐛', '🕷️', '🦗'];
        bug.textContent = bugIcons[Math.floor(Math.random() * bugIcons.length)];
        bug.className = 'bug-icon';
        
        let x = Math.random() * (window.innerWidth - 50);
        let y = Math.random() * (window.innerHeight - 50);
        bug.style.left = x + 'px';
        bug.style.top = y + 'px';
        
        document.body.appendChild(bug);

        let angle = Math.random() * Math.PI * 2;
        let speed = 1.5 + Math.random() * 2;
        
        const walkInterval = setInterval(() => {
            if (Math.random() < 0.05) {
                angle += (Math.random() - 0.5) * Math.PI;
            }
            
            x += Math.cos(angle) * speed;
            y += Math.sin(angle) * speed;

            if (x < 0 || x > window.innerWidth - 30) angle = Math.PI - angle;
            if (y < 0 || y > window.innerHeight - 30) angle = -angle;

            bug.style.left = x + 'px';
            bug.style.top = y + 'px';
            bug.style.transform = `rotate(${angle + Math.PI/2}rad)`;
        }, 30);
        
        activeIntervals.push(walkInterval);

        bug.addEventListener('mousedown', function() {
            clearInterval(walkInterval);
            this.classList.add('squashed');
            bugsSquashed++;
            
            const randomLine = Math.floor(Math.random() * 800) + 12;
            if (typeof printToTerminal === 'function') {
                printToTerminal(`[✓] Bug squashed at line ${randomLine}!`, 'term-success');
            }
            
            setTimeout(() => this.remove(), 300);

            if (bugsSquashed === totalBugs) {
                isDebugging = false;
                activeIntervals = [];
                setTimeout(() => {
                    if (typeof printToTerminal === 'function') {
                        printToTerminal(`=======================================`, 'term-info');
                        printToTerminal(`BUILD SUCCESS: All bugs squashed!`, 'term-success');
                        printToTerminal(`0 errors, 0 warnings. Ready for Production.`, 'term-success');
                    }
                }, 800);
                setTimeout(() => {
                    document.querySelectorAll('.activity-icon').forEach(icon => icon.classList.remove('active'));
                    document.querySelector('.activity-icon[title="Explorer"]').classList.add('active');
                }, 2500);
            }
        });
    }

});
