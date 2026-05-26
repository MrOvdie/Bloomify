import { Component } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {ProfileHeader} from "../../components/profile-header/profile-header";

@Component({
  selector: 'app-profile-layout',
  imports: [RouterOutlet, ProfileHeader],
  templateUrl: './profile-layout.html',
  styleUrl: './profile-layout.scss',
})
export class ProfileLayout {

}
