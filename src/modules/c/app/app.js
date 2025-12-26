import { LightningElement } from 'lwc';

export default class App extends LightningElement {
    categories = [];
    selectedCategory = null;

    async connectedCallback() {
        try {
            const response = await fetch('/questions.json');
            const data = await response.json();
            this.categories = data.categories.map(category => ({
                ...category,
                className: 'tab',
                questions: category.questions.map(q => ({ ...q, reveal: false, revealLabel: 'Show Answer' }))
            }));
            if (this.categories.length > 0) {
                this.selectCategory(this.categories[0].name);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    }

    handleTabClick(event) {
        this.selectCategory(event.target.textContent);
    }

    selectCategory(categoryName) {
        this.categories = this.categories.map(category => ({
            ...category,
            className: category.name === categoryName ? 'tab active' : 'tab'
        }));
        this.selectedCategory = this.categories.find(category => category.name === categoryName);
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
    }
}
