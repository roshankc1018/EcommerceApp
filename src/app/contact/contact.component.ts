import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { MessageData } from '../services/message.model';
import { map } from 'rxjs/operators';
import { Subject } from 'rxjs-compat/Subject';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent implements OnInit {
  submitted = false;
  contactusForm: FormGroup;
  messageData: MessageData;
  loadedPosts: MessageData[] = [];
  errormsg = new Subject<string>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.contactusForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      country: new FormControl('', Validators.required),
      message: new FormControl('', Validators.required),
    });
  }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.contactusForm.valid) {
      const name = this.contactusForm.value.name;
      const email = this.contactusForm.value.email;
      const country = this.contactusForm.value.country;
      const message = this.contactusForm.value.message;
      const messageToSend: MessageData = { name, email, country, message };
      this.authService.sendMessage(messageToSend).subscribe(
        (responsedata) => {
          console.log(responsedata);
        },
        (error) => {
          this.errormsg.next(error.message);
        }
      );
    }
    console.log(this.contactusForm);
  }
  getMessage() {
    this.authService
      .getMessage()
      .pipe(
        map((responseData: any) => {
          const messageArray: MessageData[] = [];
          for (const key in responseData) {
            messageArray.push({ ...responseData[key], id: key });
          }
          return messageArray;
        })
      )
      .subscribe((posts) => {
        this.loadedPosts = posts;
      });
  }
}
