import { LightningElement, track, wire } from 'lwc';

export default class Application extends LightningElement {
    // State management
    @track currentView = 'home'; // 'home', 'test-selection', 'questions'
    @track isLoading = true;
    @track error = null;

    // Data
    @track categories = [];
    @track tests = [];
    @track selectedCategory = null;
    @track selectedTest = null;

    // Pagination
    @track currentPage = 1;
    @track totalPages = 1;
    @track pagedQuestions = [];
    @track pageSize = 5;

    // UI state
    @track isFirstPage = true;
    @track isLastPage = true;
    @track searchTerm = '';
    @track filteredCategories = [];
    @track progressStyle = '';

    // Admin state
    @track isAdminMode = false;
    @track adminView = 'list'; // 'list', 'add', 'edit'
    @track editingQuestion = null;
    @track allQuestions = [];

    async connectedCallback() {
        await this.loadData();
    }

    async loadData() {
        try {
            this.isLoading = true;
            this.error = null;

            // Check localStorage first for admin-modified data
            const storedData = localStorage.getItem('questionsData');
            if (storedData) {
                const data = JSON.parse(storedData);
                this.processCategories(data.categories);
            } else {
                // Fallback to original questions.json
                const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
                const response = await fetch(`${base}questions.json`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.processCategories(data.categories);
            }

        } catch (error) {
            console.error('Error loading data:', error);
            this.error = 'Failed to load questions. Please try again.';
        } finally {
            this.isLoading = false;
        }
    }

    processCategories(rawCategories) {
        this.categories = rawCategories.map(category => ({
            ...category,
            className: 'tab',
            cardClass: 'category-card',
            isActive: false,
            questions: category.questions.map((q, index) => ({
                ...q,
                number: index + 1,
                optionItems: q.options ? Object.keys(q.options).sort().map(key => ({
                    key,
                    value: q.options[key],
                    selected: false,
                    class: ''
                })) : null,
                selectedOptions: [],
                isSubmitted: false,
                feedback: '',
                reveal: false,
                revealLabel: 'Show Answer',
                submitButtonText: 'Submit Answer'
            }))
        }));
        this.filteredCategories = [...this.categories];
    }

    showCategory(categoryName) {
        const category = this.categories.find(cat => cat.name === categoryName);
        if (category) {
            this.selectedCategory = category;
            this.selectedTest = null;
            this.currentView = 'questions';
            this.resetPagination();
            this.updatePagedQuestions();
        }
    }

    displayTestSelection(categoryName) {
        const category = this.categories.find(cat => cat.name === categoryName);
        if (category) {
            this.selectedCategory = category;
            this.populateTests();
            this.currentView = 'test-selection';
        }
    }

    populateTests() {
    if (!this.selectedCategory || !this.selectedCategory.questions.length) return;

    const versionRegex = /^V(\d+)/;
    const testsByVersion = this.selectedCategory.questions.reduce((acc, question) => {
        const versionMatch = question.id.match(versionRegex);
        if (versionMatch) {
            const version = versionMatch[1];
            if (!acc[version]) {
                acc[version] = {
                    name: `Test ${version}`,
                    questions: [],
                    questionCount: 0,
                    isGroup: true
                };
            }
            acc[version].questions.push(question);
            acc[version].questionCount += 1;
        }
        return acc;
    }, {});

    this.tests = Object.values(testsByVersion).map((test, index) => ({
        ...test,
        range: `${(index - 1) * test.questionCount + 1} - ${(index) * test.questionCount}`
    }));
}

    handleTestClick(event) {
        const testName = event.target.dataset.test;
        const test = this.tests.find(t => t.name === testName);

        if (test) {
            this.selectedTest = test;
            this.currentView = 'questions';
            this.resetPagination();
            this.updatePagedQuestions(test.isGroup ? test.questions : [test.questions[0]]);
        }
    }

    handleTestClick(event) {
        const testName = event.target.dataset.test;
        const test = this.tests.find(t => t.name === testName);

        if (test) {
            this.selectedTest = test;
            this.selectedCategory = {
                ...test,
                name: testName
            };
            this.currentView = 'questions';
            this.resetPagination();
            this.updatePagedQuestions();
        }
    }

    resetPagination() {
        this.currentPage = 1;
        this.totalPages = Math.max(1, Math.ceil((this.selectedCategory?.questions || []).length / this.pageSize));
        this.updatePagedQuestions();
    }

    updatePagedQuestions() {
        if (!this.selectedCategory?.questions) {
            this.pagedQuestions = [];
            return;
        }

        const all = this.selectedCategory.questions;
        this.totalPages = Math.max(1, Math.ceil(all.length / this.pageSize));

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedQuestions = all.slice(start, start + this.pageSize);

        this.isFirstPage = this.currentPage === 1;
        this.isLastPage = this.currentPage === this.totalPages;

        // Update progress style
        this.progressStyle = `width: ${(this.currentPage / this.totalPages) * 100}%`;
    }

    // Navigation methods
    backToHome() {
        this.currentView = 'home';
        this.selectedCategory = null;
        this.selectedTest = null;
        this.resetPagination();
    }

    backToTestSelection() {
        this.currentView = 'test-selection';
        this.selectedTest = null;
        this.selectedCategory = this.categories.find(cat => cat.name === 'Agentforce') || null;
        this.resetPagination();
    }

    backHandler() {
        if (this.currentView === 'questions' && this.selectedTest) {
            this.backToTestSelection();
        } else {
            this.backToHome();
        }
    }

    // Pagination methods
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagedQuestions();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagedQuestions();
        }
    }

    // Question interaction methods
    toggleAnswer(event) {
        const questionText = event.target.dataset.question;
        if (!this.selectedCategory) return;

        this.selectedCategory.questions = this.selectedCategory.questions.map(q => {
            if (q.question === questionText) {
                const reveal = !q.reveal;
                return {
                    ...q,
                    reveal,
                    revealLabel: reveal ? 'Hide Answer' : 'Show Answer'
                };
            }
            return q;
        });

        this.updatePagedQuestions();
    }

    handleOptionChange(event) {
        const questionText = event.target.dataset.question;
        const optionKey = event.target.dataset.option;
        const isChecked = event.target.checked;

        if (!this.selectedCategory) return;

        this.selectedCategory.questions = this.selectedCategory.questions.map(q => {
            if (q.question === questionText) {
                const newSelectedOptions = isChecked ? [optionKey] : [];

                const newOptionItems = q.optionItems?.map(item => ({
                    ...item,
                    selected: newSelectedOptions.includes(item.key)
                }));

                return {
                    ...q,
                    selectedOptions: newSelectedOptions,
                    optionItems: newOptionItems
                };
            }
            return q;
        });

        this.updatePagedQuestions();
    }

    handleSubmit(event) {
        const questionText = event.target.dataset.question;
        if (!this.selectedCategory) return;

        this.selectedCategory.questions = this.selectedCategory.questions.map(q => {
            if (q.question === questionText) {
                const correctAnswer = q.answer;
                const isCorrect = q.selectedOptions.includes(correctAnswer);
                const feedback = isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${correctAnswer}.`;

                const newOptionItems = q.optionItems?.map(item => ({
                    ...item,
                    class: item.key === correctAnswer ? 'correct' :
                           (q.selectedOptions.includes(item.key) && item.key !== correctAnswer ? 'incorrect' : '')
                }));

                return {
                    ...q,
                    isSubmitted: true,
                    feedback,
                    submitButtonText: 'Submitted',
                    feedbackClassString: isCorrect ? 'feedback-text correct' : 'feedback-text incorrect',
                    optionItems: newOptionItems
                };
            }
            return q;
        });

        this.updatePagedQuestions();
    }

    // Computed properties
    get showHome() {
        return this.currentView === 'home' && !this.isLoading;
    }

    get showTestSelection() {
        return this.currentView === 'test-selection';
    }

    get showQuestions() {
        return this.currentView === 'questions';
    }

    get currentTitle() {
        if (this.selectedTest) return this.selectedTest.name;
        if (this.selectedCategory) return this.selectedCategory.name;
        return 'Practice Q&A';
    }

    get hasError() {
        return this.error !== null;
    }

    get adminButtonLabel() {
        return this.isAdminMode ? 'Exit Admin' : 'Admin';
    }

    // Helper getters for template expressions
    get testsWithRanges() {
        return this.tests.map(test => ({
            ...test,
            range: this.getTestRange(test)
        }));
    }

    getTestRange(test) {
        const testNumber = parseInt(test.name.split(' ')[1]);
        const start = ((testNumber - 1) * 60) + 1;
        const end = Math.min(testNumber * 60, this.selectedCategory?.questions?.length || 0);
        return `${start} - ${end}`;
    }

    getQuestionRange() {
        if (!this.selectedCategory) return '';
        const start = ((this.currentPage - 1) * this.pageSize) + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.selectedCategory.questions.length);
        return `${start} - ${end}`;
    }

    getProgressPercentage() {
        return `${(this.currentPage / this.totalPages) * 100}%`;
    }

    getProgressStyle() {
        return `width: ${this.getProgressPercentage()}`;
    }

    get backButtonText() {
        return this.selectedTest ? 'Back to Tests' : 'Back to Categories';
    }

    get questionRangeText() {
        return `Question ${this.getQuestionRange()} of ${this.selectedCategory?.questions?.length || 0}`;
    }

    get adminNavBtnClass() {
        return this.adminView === 'list' ? 'admin-nav-btn active' : 'admin-nav-btn';
    }

    get adminNavBtnClassAdd() {
        return this.adminView === 'add' ? 'admin-nav-btn active' : 'admin-nav-btn';
    }

    get adminFormTitle() {
        return this.adminView === 'add' ? 'Add New Question' : 'Edit Question';
    }

    get adminSaveBtnText() {
        return this.adminView === 'add' ? 'Add Question' : 'Save Changes';
    }

    getSubmitButtonText(q) {
        return q.isSubmitted ? 'Submitted' : 'Submit Answer';
    }

    // Search functionality
    handleSearchChange(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.filterCategories();
    }

    filterCategories() {
        if (!this.searchTerm) {
            this.filteredCategories = [...this.categories];
        } else {
            this.filteredCategories = this.categories.filter(category =>
                category.name.toLowerCase().includes(this.searchTerm) ||
                category.questions.some(q => q.question.toLowerCase().includes(this.searchTerm))
            );
        }
    }

    // Enhanced navigation with validation
    handleTabClick(event) {
        const categoryName = event.currentTarget.dataset.name || event.target.textContent?.trim();

        if (!categoryName) return;

        const category = this.categories.find(cat => cat.name === categoryName);
        if (!category) return;

        // Check if category has questions
        if (!category.questions || category.questions.length === 0) {
            alert(`No questions available for ${categoryName} yet. Please check back later.`);
            return;
        }

        if (categoryName === 'Agentforce') {
            this.displayTestSelection(categoryName);
        } else {
            this.showCategory(categoryName);
        }
    }

    // Admin methods
    toggleAdminMode() {
        this.isAdminMode = !this.isAdminMode;
        if (this.isAdminMode) {
            this.currentView = 'admin';
            this.loadAllQuestions();
        } else {
            this.currentView = 'home';
        }
    }

    loadAllQuestions() {
        this.allQuestions = [];
        this.categories.forEach(category => {
            category.questions.forEach(question => {
                this.allQuestions.push({
                    ...question,
                    category: category.name
                });
            });
        });
    }

    showAdminList() {
        this.adminView = 'list';
        this.editingQuestion = null;
    }

    showAdminAdd() {
        this.adminView = 'add';
        this.editingQuestion = {
            question: '',
            options: { A: '', B: '', C: '', D: '' },
            answer: '',
            explanation: '',
            category: ''
        };
    }

    editQuestion(event) {
        const questionId = event.target.dataset.id;
        const question = this.allQuestions.find(q => q.question === questionId);
        if (question) {
            this.editingQuestion = { ...question };
            this.adminView = 'edit';
        }
    }

    deleteQuestion(event) {
        const questionId = event.target.dataset.id;
        if (confirm('Are you sure you want to delete this question?')) {
            this.allQuestions = this.allQuestions.filter(q => q.question !== questionId);
            this.saveQuestions();
            this.loadAllQuestions();
        }
    }

    saveQuestion() {
        if (!this.editingQuestion.question || !this.editingQuestion.category) {
            alert('Please fill in the question and category.');
            return;
        }

        if (this.adminView === 'add') {
            this.allQuestions.push({ ...this.editingQuestion });
        } else {
            const index = this.allQuestions.findIndex(q => q.question === this.editingQuestion.originalQuestion);
            if (index !== -1) {
                this.allQuestions[index] = { ...this.editingQuestion };
            }
        }

        this.saveQuestions();
        this.loadAllQuestions();
        this.showAdminList();
    }

    saveQuestions() {
        const categoriesMap = {};
        this.allQuestions.forEach(q => {
            if (!categoriesMap[q.category]) {
                categoriesMap[q.category] = [];
            }
            const { category, ...questionData } = q;
            categoriesMap[q.category].push(questionData);
        });

        const categories = Object.keys(categoriesMap).map(name => ({
            name,
            questions: categoriesMap[name]
        }));

        localStorage.setItem('questionsData', JSON.stringify({ categories }));
        this.processCategories(categories);
    }

    cancelEdit() {
        this.showAdminList();
    }

    updateQuestionField(event) {
        const field = event.target.dataset.field;
        const value = event.target.value;
        this.editingQuestion = { ...this.editingQuestion, [field]: value };
    }

    updateOption(event) {
        const optionKey = event.target.dataset.option;
        const value = event.target.value;
        this.editingQuestion.options = {
            ...this.editingQuestion.options,
            [optionKey]: value
        };
    }
}
