import { LightningElement } from 'lwc';

export default class Application extends LightningElement {
    categories = [];
    selectedCategory = null;
    showCategoryPage = true;
    pageSize = 5;
    currentPage = 1;
    totalPages = 1;
    pagedQuestions = [];
    revealLabel  =true;

    async connectedCallback() {
        try {
                const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
                const response = await fetch(`${base}questions.json`);
            const data = await response.json();
            this.categories = data.categories.map(category => ({
                ...category,
                className: 'tab',
                cardClass: 'category-card',
                questions: category.questions.map((q, index) => ({
                    ...q,
                    number: index + 1,
                    optionItems: q.options ? Object.keys(q.options).sort().map(key => ({ key, value: q.options[key], selected: false, class: '' })) : null,
                    selectedOptions: [],
                    isSubmitted: false,
                    feedback: ''
                }))
            }));
            if (this.categories.length > 0) {
                this.selectCategory(this.categories[0].name);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    }

    handleTabClick(event) {
        const el = event.currentTarget || event.target;
        const name = el.dataset && el.dataset.name ? el.dataset.name : (event.target && event.target.textContent);
        if (name) this.selectCategory(name);
        this.showCategoryPage = false;

    }

    selectCategory(categoryName) {
        this.categories = this.categories.map(category => ({
            ...category,
            className: category.name === categoryName ? 'tab active' : 'tab',
            cardClass: category.name === categoryName ? 'category-card active' : 'category-card'
        }));
        this.selectedCategory = this.categories.find(category => category.name === categoryName);
        // show paged view
        this.currentPage = 1;
        this.totalPages = Math.max(1, Math.ceil((this.selectedCategory.questions || []).length / this.pageSize));
        this.updatePagedQuestions();
        this.showCategoryPage = true;
    }

    toggleAnswer(event) {
        const questionText = event.target.dataset.question;
        const newQuestions = this.selectedCategory.questions.map(q => {
            if (q.question === questionText) {
                const reveal = !q.reveal;
                return { ...q, reveal, revealLabel: reveal ? 'Hide Answer' : 'Show Answer' };
            }
            return q;
        });
        this.selectedCategory = { ...this.selectedCategory, questions: newQuestions };
        // update paged subset
        this.updatePagedQuestions();
    }

    updatePagedQuestions() {
        const all = this.selectedCategory ? this.selectedCategory.questions : [];
        this.totalPages = Math.max(1, Math.ceil(all.length / this.pageSize));
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedQuestions = all.slice(start, start + this.pageSize);
        this.isFirstPage = this.currentPage === 1;
        this.isLastPage = this.currentPage === this.totalPages;
    }

    backToHome() {
        this.showCategoryPage = true;
        this.selectedCategory = null;
        // reset classes
        this.categories = this.categories.map(category => ({ ...category, className: 'tab', cardClass: 'category-card' }));
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage += 1;
            this.updatePagedQuestions();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.updatePagedQuestions();
        }
    }

    handleOptionChange(event) {
        const questionText = event.target.dataset.question;
        const optionKey = event.target.dataset.option;
        const isChecked = event.target.checked;

        const newQuestions = this.selectedCategory.questions.map(q => {
            if (q.question === questionText) {
                const newSelectedOptions = isChecked
                    ? [...q.selectedOptions, optionKey]
                    : q.selectedOptions.filter(opt => opt !== optionKey);
                const newOptionItems = q.optionItems.map(item => ({
                    ...item,
                    selected: newSelectedOptions.includes(item.key)
                }));
                return { ...q, selectedOptions: newSelectedOptions, optionItems: newOptionItems };
            }
            return q;
        });
        this.selectedCategory = { ...this.selectedCategory, questions: newQuestions };
        this.updatePagedQuestions();
    }

    handleSubmit(event) {
        const questionText = event.target.dataset.question;
        const newQuestions = this.selectedCategory.questions.map(q => {
            if (q.question === questionText) {
                const correctAnswer = q.answer;
                const isCorrect = q.selectedOptions.includes(correctAnswer);
                const feedback = isCorrect ? 'Correct!' : 'Incorrect. The correct answer is ' + correctAnswer + '.';
                const newOptionItems = q.optionItems.map(item => ({
                    ...item,
                    class: item.key === correctAnswer ? 'correct' : (q.selectedOptions.includes(item.key) && item.key !== correctAnswer ? 'incorrect' : '')
                }));
                return { ...q, isSubmitted: true, feedback, optionItems: newOptionItems };
            }
            return q;
        });
        this.selectedCategory = { ...this.selectedCategory, questions: newQuestions };
        this.updatePagedQuestions();
    }
}
