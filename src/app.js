import axios from 'axios';
import UtilsDate from './app/utils/UtilsDate';

export default class App {
    constructor(){
        this.baseUrl = 'https://resume-online-back.herokuapp.com'
        this.addEvents();
        this.populateMessages();
    }

    addEvents(){
        const profile = document.getElementById('btn-profile');
        const contact = document.getElementById('btn-contact');

        profile.addEventListener('click', event => {
            event.preventDefault();

            document.getElementById('profile').classList.remove('d-none');
            document.getElementById('contact').classList.add('d-none');
        });

        contact.addEventListener('click', event => {
            event.preventDefault();

            document.getElementById('profile').classList.add('d-none');
            document.getElementById('contact').classList.remove('d-none');
        });

        const btnMessage = document.getElementById('btn-message');

        btnMessage.addEventListener('click', event => {
            event.preventDefault();

            this.newMessage(btnMessage);
        });

        const btnContact = document.getElementsByClassName('btn-contact')[0];

        btnContact.addEventListener('click', event => {
            event.preventDefault();

            this.newContact(btnContact);
        });

        const login = document.getElementById('login');

        login.addEventListener('click', event => {
            event.preventDefault();

            document.getElementsByClassName('wrapper')[0].classList.add('d-none');
            document.getElementsByClassName('page-login')[0].classList.remove('d-none');
        });

        const btnLogin = document.getElementsByClassName('btnLogin')[0];

        btnLogin.addEventListener('click', event => {
            event.preventDefault();

            this.login(btnLogin);
        });

        const logout = document.getElementsByClassName('logout')[0];
        logout.addEventListener('click', event => {
            event.preventDefault();

            this.logout();
        });

        const search = document.getElementsByClassName('search')[0];
        search.addEventListener('keyup', event => {
            event.preventDefault();

            let text = search.value;

            if (text) {
                this.getMailByText(text);
            } else {
                this.populateInbox();
            }
        });
    }

    logout(){
        localStorage.removeItem('userResume');
        this.userSession();        
    }

    userSession() {
        const user = localStorage.getItem('userResume');

        if (user) {
            this.pageAdmin();
        } else {
            this.profilePage();
        }
    }

    async login(btn) {
        let login = {};
        let isValid = true;

        const formSignin = document.getElementsByClassName('form-signin')[0];

        [...formSignin.elements].forEach(field => {
            if(['email', 'password'].indexOf(field.name) > -1 && !field.value || (field.value).length < 3){
                field.parentElement.classList.add('has-error');
                field.classList.add('has-error');
                isValid = false;                
            } else {
                field.parentElement.classList.remove('has-error');
                field.classList.remove('has-error');
            }

            if (field.name){
                login[field.name] = field.value;
            }
            
        });

        if(!isValid){
            return false;
        }
        try{ 
            btn.disabled = true;
            const newLogin = await axios.post(`${this.baseUrl}/login`, login);
            if(newLogin.status == 200){
                formSignin.reset();
                localStorage.setItem('userResume', newLogin.data.user);
                this.pageAdmin();              
            }    
            
        } catch (error) {
            this.setLoginError();
        }

        btn.disabled = false;        
    }

    pageAdmin() {
        document.getElementsByClassName('wrapper')[0].classList.add('d-none');
        document.getElementsByClassName('page-login')[0].classList.add('d-none');
        document.getElementsByClassName('page-admin')[0].classList.remove('d-none');
        
        this.populateInbox();
    }
    
    profilePage() {
        document.getElementsByClassName('wrapper')[0].classList.remove('d-none');
        document.getElementsByClassName('page-login')[0].classList.add('d-none');
        document.getElementsByClassName('page-admin')[0].classList.add('d-none');
    }

    async populateInbox(page = 1) {
        try{ 
            const readContact = await axios.get(`${this.baseUrl}/contact`, {
                params: {
                    limit: '5',
                    page,
                }
            });
            this.populateEmail(readContact.data, page);
        } catch (error) {
            console.log(error);
        }
    }

    populateEmail(data, page, text){
        const inbox = document.getElementById('table-inbox');

        inbox.innerHTML = "";

        data.rows.forEach(item => {
            let date = new Date(Date.parse(item.created_at));
            inbox.innerHTML += `
            <tr>
                <td class="mailbox-name"><a href="#">${item.name}</a></td>
                <td class="mailbox-subject">${item.message}</td>
                <td class="mailbox-email">${item.email}</td>
                <td class="mailbox-phone">${item.phone}</td>
                <td class="mailbox-date">${UtilsDate.dateFormat(date)}</td>
            </tr>       
            `;
        });

        this.setPagination(data.count, page, text);
    }

    async getMailByText(text, page = 1){
        try{
            const result = await axios.get(`${this.baseUrl}/contact`, {
                params: {
                    limit: 5,
                    page,
                    text,
                }
            })
            this.populateEmail(result.data, page, text);
        } catch (error) {
            console.log(error);
        }
    }

    setPagination(totalItems, page, text){
        const pages = Math.ceil(totalItems / 5);
        let activePage = page;

        if (!page) {
            activePage = 1;
        }
    
        document.querySelector('.inbox-pagination').innerHTML = '';
    
        for(let i = 1; i <= pages; i++){
            const li = `<li class="page-item"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            
            document.querySelector('.inbox-pagination').innerHTML += li;
    
            for (let link of document.getElementsByClassName('page-link')){
                link.addEventListener('click', (event) => {
                    event.preventDefault();
    
                    const page = event.target.dataset.page;
                    const offset = (parseInt(page));
                    if (!text) {
                        this.populateInbox(offset);
                    } else {
                        this.getMailByText(text, offset);
                    }                 
                });
            }

            if (i === activePage) {
                let item = document.querySelector(`[data-page="${i}"]`).parentElement;
                item.classList.add("active");                
            }
        }
    }

    async populateMessages() {
        try{ 
            const readMessage = await axios.get(`${this.baseUrl}/message`);
            this.populateComments(readMessage.data);
        } catch (error) {
            console.log(error);
        }
    }

    populateComments(data) {
        const messages = document.getElementById('messages');

        messages.innerHTML = "";

        data.rows.forEach(item => {            
            let date = new Date(Date.parse(item.created_at));

            messages.innerHTML += `
                <div>
                    <hr>
                    <p class="text-justify float-right">${UtilsDate.dateFormat(date)}</p>
                    <h4 class="box-title">${item.name}</h4>    
                    <p class="text-justify">${item.content}</p>
                    <hr>
                </div>
            `;
        })
    }

    async newMessage(btn) {
        let message = {};
        let isValid = true;

        const formMessage = document.getElementById('form-message');

        [...formMessage.elements].forEach(field => {
            if(['name', 'content'].indexOf(field.name) > -1 && !field.value || (field.value).length < 3){
                field.parentElement.classList.add('has-error');
                field.classList.add('has-error');
                isValid = false;                
            } else {
                field.parentElement.classList.remove('has-error');
                field.classList.remove('has-error');
            }

            if (field.name){
                message[field.name] = field.value;
            }            
        });

        if(!isValid){
            return false;
        }
        try{ 
            btn.disabled = true;
            btn.value = 'enviando...';
            const addMessage = await axios.post(`${this.baseUrl}/message`, message);
            btn.value = 'Publicar';
            formMessage.reset();
            this.populateMessages();
        } catch (error) {
            console.log(error);
        }

        btn.disabled = false;
    }

    async newContact(btn) {
        let contact = {};
        let isValid = true;

        const formContact = document.getElementById('form-contact');

        [...formContact.elements].forEach(field => {
            if(['name', 'email', 'phone', 'message'].indexOf(field.name) > -1 && !field.value || (field.value).length < 3){
                field.parentElement.classList.add('has-error');
                field.classList.add('has-error');
                isValid = false;                
            } else {
                field.parentElement.classList.remove('has-error');
                field.classList.remove('has-error');
            }

            if (field.name){
                contact[field.name] = field.value;
            }            
        });

        if(!isValid){
            return false;
        }
        try{ 
            btn.disabled = true;
            btn.value = 'enviando...';
            const addContact = await axios.post(`${this.baseUrl}/contact`, contact);
            if(addContact.status == 200){                
                this.setMessageSuccess();
            }
            btn.value = 'Enviar';
            formContact.reset();
        } catch (error) {
            console.log(error);
        }
        btn.disabled = false;
    }

    setMessageSuccess() {
        const success = document.getElementsByClassName('alert-success')[0];
        success.classList.remove('d-none');

        setTimeout(() => {
            success.classList.add('d-none');
        }, 7000);
    }

    setLoginError() {
        const errorLogin = document.getElementsByClassName('alert-danger-login')[0];
        errorLogin.classList.remove('d-none');
    }
}