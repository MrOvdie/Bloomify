import {Injectable, inject} from '@angular/core';
import {map, Observable, switchMap} from 'rxjs';
import {UserService} from '../../core/api';
import {UserProfileDto, GlobalUserDashboardDto} from '../../core/api';

export interface CombinedProfileData {
  profile: UserProfileDto;
  stats: GlobalUserDashboardDto;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // Інжектуємо твій автозгенерований клієнт
  private profileApi = inject(UserService);

  getFullProfileData(): Observable<CombinedProfileData> {
    return this.profileApi.apiUserMeGet().pipe(
      switchMap((profileData: UserProfileDto) => {

        const userId = profileData.id ?? '';

        return this.profileApi.apiUserProfileStatisticsUserIdGet(userId).pipe(
          map((statsData: GlobalUserDashboardDto) => {
            return {
              profile: profileData,
              stats: statsData
            };
          })
        );
      })
    );
  }
}
